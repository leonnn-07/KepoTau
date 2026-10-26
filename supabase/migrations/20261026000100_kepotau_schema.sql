-- =============================================================================
-- Kepotau: schema, row level security, storage bucket and cleanup functions.
--
-- Run this once against your Supabase project (SQL Editor or `supabase db push`).
-- It is idempotent where Postgres allows it, so re-running it is safe.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- user_settings: per-user configuration of the publication-completion event.
--
--   both       -> complete once the video is posted on Instagram AND TikTok
--   either     -> complete once it is posted on Instagram OR TikTok
--   instagram  -> complete once it is posted on Instagram
--   tiktok     -> complete once it is posted on TikTok
--
-- The stored MP4 is deleted 24 hours after the completion event.
-- -----------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id         uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  completion_rule text not null default 'both'
                  check (completion_rule in ('both', 'either', 'instagram', 'tiktok')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- videos
-- -----------------------------------------------------------------------------
create table if not exists public.videos (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title                text not null check (char_length(title) between 1 and 200),
  caption              text not null default '' check (char_length(caption) <= 5000),
  hashtags             text[] not null default '{}' check (cardinality(hashtags) <= 60),
  notes                text not null default '' check (char_length(notes) <= 5000),
  category             text check (category is null or char_length(category) between 1 and 60),
  storage_path         text not null unique,
  thumbnail_path       text,
  original_filename    text not null check (char_length(original_filename) between 1 and 255),
  file_size            bigint not null check (file_size > 0),
  status               text not null default 'ready'
                       check (status in ('ready', 'partially_posted', 'posted', 'archived')),
  instagram_posted_at  timestamptz,
  tiktok_posted_at     timestamptz,
  posted_at            timestamptz,
  delete_at            timestamptz,
  file_deleted_at      timestamptz,
  cleanup_attempts     integer not null default 0,
  cleanup_last_error   text,
  cleanup_locked_until timestamptz,
  search_text          text not null default '',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- Files must live in the owner's folder: <user_id>/<file>
  constraint videos_storage_path_owner check (split_part(storage_path, '/', 1) = user_id::text),
  constraint videos_thumbnail_path_owner check (
    thumbnail_path is null or split_part(thumbnail_path, '/', 1) = user_id::text
  )
);

comment on column public.videos.status is
  'ready = not posted, partially_posted = posted on some platforms, posted = completion event reached and file deletion scheduled, archived = file deleted, metadata kept';
comment on column public.videos.delete_at is
  'When the stored file becomes eligible for deletion (completion event + 24h). Null while unposted.';
comment on column public.videos.file_deleted_at is
  'When the cleanup job removed the file from storage. Metadata is kept for publication history.';

create index if not exists videos_user_created_idx  on public.videos (user_id, created_at desc);
create index if not exists videos_user_status_idx   on public.videos (user_id, status);
create index if not exists videos_user_category_idx on public.videos (user_id, category);
create index if not exists videos_user_posted_idx   on public.videos (user_id, posted_at desc)
  where instagram_posted_at is not null or tiktok_posted_at is not null;
create index if not exists videos_cleanup_due_idx   on public.videos (delete_at)
  where file_deleted_at is null and delete_at is not null;
create index if not exists videos_hashtags_idx      on public.videos using gin (hashtags);
create index if not exists videos_search_trgm_idx   on public.videos using gin (search_text extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Lifecycle trigger: derives status, posted_at and delete_at on the server so
-- clients can never schedule (or skip) a deletion themselves.
-- -----------------------------------------------------------------------------
create or replace function public.videos_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_rule      text;
  v_completed timestamptz;
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.created_at := now();
  end if;

  new.search_text := lower(concat_ws(' ',
    new.title, new.caption, array_to_string(new.hashtags, ' '),
    new.notes, new.category, new.original_filename));

  if new.instagram_posted_at > now() + interval '5 minutes'
     or new.tiktok_posted_at > now() + interval '5 minutes' then
    raise exception 'Publication time cannot be in the future' using errcode = 'check_violation';
  end if;

  -- Once the file is gone the publication record is frozen.
  if tg_op = 'UPDATE' and old.file_deleted_at is not null then
    if new.instagram_posted_at is distinct from old.instagram_posted_at
       or new.tiktok_posted_at is distinct from old.tiktok_posted_at then
      raise exception 'Publication status cannot change after the video file was deleted'
        using errcode = 'check_violation';
    end if;
    new.file_deleted_at := old.file_deleted_at;
    new.posted_at       := old.posted_at;
    new.delete_at       := old.delete_at;
    new.status          := 'archived';
    return new;
  end if;

  if new.file_deleted_at is not null then
    new.status := 'archived';
    return new;
  end if;

  select s.completion_rule into v_rule
  from public.user_settings s
  where s.user_id = new.user_id;
  v_rule := coalesce(v_rule, 'both');

  -- greatest()/least() ignore nulls in Postgres.
  v_completed := case v_rule
    when 'both' then
      case when new.instagram_posted_at is not null and new.tiktok_posted_at is not null
           then greatest(new.instagram_posted_at, new.tiktok_posted_at) end
    when 'either'    then least(new.instagram_posted_at, new.tiktok_posted_at)
    when 'instagram' then new.instagram_posted_at
    when 'tiktok'    then new.tiktok_posted_at
  end;

  if v_completed is null then
    new.posted_at := null;
    new.delete_at := null;
    new.status := case
      when new.instagram_posted_at is not null or new.tiktok_posted_at is not null
        then 'partially_posted'
      else 'ready'
    end;
    new.cleanup_attempts     := 0;
    new.cleanup_last_error   := null;
    new.cleanup_locked_until := null;
  else
    if tg_op = 'INSERT' or old.delete_at is null then
      -- Newly completed: never schedule less than 24h from now, even when the
      -- completion timestamp lies in the past (e.g. after a settings change).
      new.delete_at := greatest(v_completed, now()) + interval '24 hours';
    elsif v_completed is distinct from old.posted_at then
      -- The completion moment moved (e.g. rule change): may postpone, never hasten.
      new.delete_at := greatest(old.delete_at, v_completed + interval '24 hours');
    else
      -- Unrelated update (metadata edit, cleanup bookkeeping): keep the schedule.
      new.delete_at := old.delete_at;
    end if;
    new.posted_at := v_completed;
    new.status    := 'posted';
  end if;

  return new;
end;
$$;

drop trigger if exists videos_before_write on public.videos;
create trigger videos_before_write
  before insert or update on public.videos
  for each row execute function public.videos_before_write();

-- Changing the completion rule re-evaluates every video that still has its file.
create or replace function public.user_settings_after_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.videos
     set updated_at = now()
   where user_id = new.user_id
     and file_deleted_at is null;
  return null;
end;
$$;

drop trigger if exists user_settings_after_write on public.user_settings;
create trigger user_settings_after_write
  after insert or update of completion_rule on public.user_settings
  for each row execute function public.user_settings_after_write();

create or replace function public.user_settings_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_settings_before_update on public.user_settings;
create trigger user_settings_before_update
  before update on public.user_settings
  for each row execute function public.user_settings_before_update();

-- Create default settings for every new auth user (and backfill existing ones).
create or replace function public.handle_new_user_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_kepotau on auth.users;
create trigger on_auth_user_created_kepotau
  after insert on auth.users
  for each row execute function public.handle_new_user_settings();

insert into public.user_settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- -----------------------------------------------------------------------------
-- Privileges + Row Level Security. Users can only see and change their own
-- rows, and only the columns they are meant to edit.
-- -----------------------------------------------------------------------------
alter table public.videos        enable row level security;
alter table public.user_settings enable row level security;

revoke all on public.videos        from anon, authenticated;
revoke all on public.user_settings from anon, authenticated;

grant select, delete on public.videos to authenticated;
grant insert (id, title, caption, hashtags, notes, category, storage_path, thumbnail_path,
              original_filename, file_size)
  on public.videos to authenticated;
grant update (title, caption, hashtags, notes, category, instagram_posted_at, tiktok_posted_at)
  on public.videos to authenticated;

grant select on public.user_settings to authenticated;
grant insert (completion_rule), update (completion_rule) on public.user_settings to authenticated;

drop policy if exists "videos: owner can read"   on public.videos;
drop policy if exists "videos: owner can insert" on public.videos;
drop policy if exists "videos: owner can update" on public.videos;
drop policy if exists "videos: owner can delete" on public.videos;

create policy "videos: owner can read" on public.videos
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "videos: owner can insert" on public.videos
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "videos: owner can update" on public.videos
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "videos: owner can delete" on public.videos
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_settings: owner can read"   on public.user_settings;
drop policy if exists "user_settings: owner can insert" on public.user_settings;
drop policy if exists "user_settings: owner can update" on public.user_settings;

create policy "user_settings: owner can read" on public.user_settings
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_settings: owner can insert" on public.user_settings
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "user_settings: owner can update" on public.user_settings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- Storage: private "video-stock" bucket, one folder per user.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('video-stock', 'video-stock', false, 524288000, array['video/mp4', 'image/jpeg'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "video-stock: owner can read"   on storage.objects;
drop policy if exists "video-stock: owner can upload" on storage.objects;
drop policy if exists "video-stock: owner can update" on storage.objects;
drop policy if exists "video-stock: owner can delete" on storage.objects;

create policy "video-stock: owner can read" on storage.objects
  for select to authenticated
  using (bucket_id = 'video-stock' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "video-stock: owner can upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'video-stock' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "video-stock: owner can update" on storage.objects
  for update to authenticated
  using (bucket_id = 'video-stock' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'video-stock' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "video-stock: owner can delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'video-stock' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- -----------------------------------------------------------------------------
-- Cleanup functions, callable by the service role only (used by
-- /api/cron/cleanup, which is triggered by Supabase Cron and/or Vercel Cron).
-- -----------------------------------------------------------------------------

-- Atomically claims due videos so concurrent runs never process the same row.
create or replace function public.claim_videos_for_cleanup(
  p_limit        integer default 20,
  p_lock_minutes integer default 10
)
returns setof public.videos
language sql
security definer
set search_path = ''
as $$
  update public.videos v
     set cleanup_locked_until = now() + make_interval(mins => p_lock_minutes),
         cleanup_attempts     = v.cleanup_attempts + 1
   where v.id in (
     select c.id
       from public.videos c
      where c.status = 'posted'
        and c.posted_at is not null
        and c.delete_at is not null
        and c.delete_at <= now()
        and c.file_deleted_at is null
        and (c.cleanup_locked_until is null or c.cleanup_locked_until <= now())
      order by c.delete_at
      limit greatest(1, least(p_limit, 100))
      for update skip locked
   )
  returning v.*;
$$;

-- Marks the file as removed; the row (captions, hashtags, history) stays.
create or replace function public.mark_video_file_deleted(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.videos
     set file_deleted_at      = now(),
         cleanup_last_error   = null,
         cleanup_locked_until = null
   where id = p_id
     and file_deleted_at is null
     and delete_at is not null
     and delete_at <= now();
$$;

-- Records a failure and backs off exponentially (2, 4, 8 ... minutes, max 6h).
create or replace function public.record_video_cleanup_failure(p_id uuid, p_error text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.videos
     set cleanup_last_error   = left(coalesce(p_error, 'unknown error'), 1000),
         cleanup_locked_until = now() + least(
           interval '6 hours',
           make_interval(mins => power(2, least(cleanup_attempts, 12))::integer)
         )
   where id = p_id
     and file_deleted_at is null;
$$;

revoke execute on function public.claim_videos_for_cleanup(integer, integer) from public, anon, authenticated;
revoke execute on function public.mark_video_file_deleted(uuid)              from public, anon, authenticated;
revoke execute on function public.record_video_cleanup_failure(uuid, text)   from public, anon, authenticated;
revoke execute on function public.user_settings_after_write()                from public, anon, authenticated;
revoke execute on function public.handle_new_user_settings()                 from public, anon, authenticated;

grant execute on function public.claim_videos_for_cleanup(integer, integer) to service_role;
grant execute on function public.mark_video_file_deleted(uuid)              to service_role;
grant execute on function public.record_video_cleanup_failure(uuid, text)   to service_role;
