# Kepotau

Kepotau is a private video stock manager for Instagram and TikTok creators. Upload MP4s from your desktop, write captions and hashtags once, then preview, download and copy everything from your phone when it's time to post. Kepotau tracks publication on each platform separately. Once a video is published, the stored file is deleted automatically 24 hours later, and the captions and posting history are kept.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Supabase Postgres, Auth and Storage · Vercel.

## Features

- **Uploads with progress.** MP4s go straight from the browser to the private `video-stock` bucket using Supabase's resumable (TUS) protocol. Uploads show progress, can be cancelled, and resume after network errors. A poster frame is captured on the client as the thumbnail.
- **Metadata.** Title, caption (with an Instagram/TikTok length hint), hashtags (normalised and deduplicated), category (autocompleted from the ones you already use) and private notes. All of it is editable later.
- **Mobile.** Preview through short-lived signed URLs. Download keeps the original filename. One tap copies the caption, the hashtags, or both.
- **Search and filters.** Full-text search across title, caption, hashtags, notes and filename (trigram index), plus filters for category and status.
- **Publication tracking.** Instagram and TikTok are marked separately, with timestamps and undo. The **Published history** page lists everything you've posted, including videos whose files are already deleted.
- **Configurable completion event.** In Settings you choose when a video counts as "published": Instagram **and** TikTok (the default), **either** one, Instagram only, or TikTok only. 24 hours after that event the file is deleted.
- **Automatic cleanup.** A server-side job runs on a schedule (Supabase Cron, with Vercel Cron as a backup). It only deletes files whose `delete_at` has passed, never touches unposted videos, and retries failures with backoff.

## How it works

```
Browser ──TUS upload──▶ Supabase Storage (private bucket "video-stock", <user_id>/<video_id>.mp4)
   │
   └─ Server Action ──▶ public.videos (RLS: owner only)
                            │  BEFORE INSERT/UPDATE trigger derives
                            │  status, posted_at and delete_at (= completion + 24h)
                            ▼
Supabase Cron (every 15 min) ──POST──▶ /api/cron/cleanup  (Bearer CRON_SECRET)
                                         ├─ claim_videos_for_cleanup()  (FOR UPDATE SKIP LOCKED + lease)
                                         ├─ Storage API: remove mp4 + thumbnail
                                         └─ mark_video_file_deleted()   → status "archived", metadata kept
```

- **Status lifecycle:** `ready` (not posted) → `partially_posted` → `posted` (deletion scheduled) → `archived` (file deleted, metadata kept).
- The database computes `posted_at`, `delete_at` and `status`, so a client can't schedule or skip a deletion. Column-level grants stop users from writing those columns at all.
- A newly completed video always gets **at least 24 hours** from the moment it was marked. A schedule that has already started can be postponed but never shortened. Undoing a publication before the deadline cancels the deletion.
- **Cleanup safety:** rows are claimed atomically, so overlapping runs can't double-process them. Each row is re-checked before deletion. Removing a file that's already gone counts as success, so the job is idempotent. Failures are recorded in `cleanup_last_error` and retried with exponential backoff (2 minutes up to 6 hours), and the error shows on the video page.
- **Secrets:** the service-role key is only used by `/api/cron/cleanup` (`src/lib/supabase/admin.ts`, marked `server-only`). Everything else runs as the signed-in user under Row Level Security.

## Setup

### 1. Create the Supabase project

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Run the migration. Use **one** of these:
   - **SQL Editor:** paste the contents of `supabase/migrations/20261026000100_kepotau_schema.sql` and click **Run**. The script is safe to run more than once.
   - **CLI:** `npx supabase link --project-ref <your-ref>` then `npx supabase db push`.

   The migration creates:
   - the `videos` and `user_settings` tables, with indexes, triggers, RLS policies and column grants
   - the private `video-stock` bucket (MP4 and JPEG only, 500 MB per-file limit)
   - the storage policies, which restrict each user to their own `<user_id>/` folder
   - the cleanup functions, which only the service role can execute
3. **Storage upload limit.** Go to **Storage → Settings** and check the *global* upload size limit. On the Free plan it's capped at 50 MB, so MP4s larger than that are rejected no matter what the bucket limit says. Set `NEXT_PUBLIC_MAX_UPLOAD_MB` to match.
4. **Verify the policies** under **Storage → Policies**. You should see four `video-stock: owner can …` policies on `storage.objects`.

### 2. Create your user account

Kepotau has no public sign-up page. You create the account yourself:

1. Go to **Authentication → Users → Add user → Create new user**.
2. Enter your email and a strong password, and tick **Auto Confirm User**.
3. Recommended: disable public sign-ups under **Authentication → Sign In / Providers** → turn off *Allow new users to sign up*.
4. Under **Authentication → URL Configuration**, set **Site URL** to your production URL (for example `https://kepotau.vercel.app`).

A row in `user_settings` is created automatically for every user, by a trigger on `auth.users`.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values. You'll find them under **Project Settings → API Keys** and **Data API**.

| Variable | Where it's used | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser and server | Project URL, `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser and server | `anon` key (legacy) or `sb_publishable_…` key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** (cleanup job) | `service_role` key (legacy) or `sb_secret_…` key |
| `CRON_SECRET` | **server only** | random string, e.g. `openssl rand -hex 32` |
| `NEXT_PUBLIC_MAX_UPLOAD_MB` | browser | optional, default `50` |

Never prefix the service role key or `CRON_SECRET` with `NEXT_PUBLIC_`.

### 4. Run locally

```bash
npm install
npm run verify:supabase   # checks URL, keys, tables, bucket, function permissions
npm run dev               # http://localhost:3000
```

Other checks: `npm run lint`, `npm run typecheck`, `npm run build`.

To work against a fully local Supabase stack (needs Docker), run `npx supabase start`. It applies the migration automatically. Then put the printed local URL and keys into `.env.local` and create a user through Studio or the Admin API.

## Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel. It's detected as Next.js, and no build settings need changing.
2. Under **Settings → Environment Variables**, add all five variables from the table above for **Production** (and **Preview** if you use it). The `NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changing them.
3. Deploy, then add the production URL as the **Site URL** in Supabase Auth (step 2.4 above).

### Activate the scheduled cleanup

**Primary: Supabase Cron (every 15 minutes)**

1. Open `supabase/cron/schedule-cleanup.sql`.
2. Replace `https://YOUR-APP.vercel.app` with your production URL and `REPLACE_WITH_YOUR_CRON_SECRET` with your `CRON_SECRET`.
3. Run it in the Supabase **SQL Editor**. It enables `pg_cron` and `pg_net`, stores both values in Vault, and schedules `kepotau-cleanup-expired-videos`.
4. Check that it ran: `select * from cron.job_run_details order by start_time desc limit 5;` and `select status_code, content from net._http_response order by created desc limit 5;`. Look for status `200`.

**Backup: Vercel Cron.** `vercel.json` also calls `/api/cron/cleanup` once a day at 03:00 UTC. That's the most frequent schedule the Hobby plan allows. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when `CRON_SECRET` is set. On its own, this backup would delete files up to a day late, which is why Supabase Cron is the primary scheduler.

**Manual run** (useful for testing):

```bash
curl -X POST https://YOUR-APP.vercel.app/api/cron/cleanup \
  -H "Authorization: Bearer $CRON_SECRET"
# {"ok":true,"claimed":1,"deleted":1,"failed":0,"skipped":0,"errors":[]}
```

## Project structure

```
src/
  proxy.ts                         session refresh and route protection (Next 16 "proxy", formerly middleware)
  lib/supabase/{client,server,proxy,admin}.ts
  lib/{auth,queries,cleanup,videos,env,database.types}.ts
  app/login/                       sign-in (Server Action)
  app/(app)/videos/                library, search and filters, detail, edit
  app/(app)/upload/                resumable uploader
  app/(app)/history/               published history
  app/(app)/settings/              completion rule, account
  app/(app)/video-actions.ts       Server Actions (create, update, publish, delete, settings)
  app/api/videos/[id]/download/    signed download redirect
  app/api/cron/cleanup/            scheduled cleanup endpoint
supabase/migrations/               schema, RLS, storage bucket and policies, cleanup functions
supabase/cron/                     Supabase Cron schedule script
scripts/verify-supabase.mjs        connection and setup check
```

## Troubleshooting

- **"Supabase is not configured"** on the login page: the `NEXT_PUBLIC_*` variables were missing at build time. Set them and rebuild or redeploy.
- **Upload fails with "larger than your Supabase upload limit"**: raise the global limit in Storage → Settings (paid plans only), or upload a smaller file.
- **"bucket does not exist"** or **"relation public.videos does not exist"**: the migration hasn't been run.
- **Cleanup returns 401**: the `CRON_SECRET` in Vercel and the one in Vault don't match. Update it in Vault with `select vault.update_secret((select id from vault.secrets where name = 'kepotau_cron_secret'), 'new-value');`.
- **Cleanup returns 500 "SUPABASE_SERVICE_ROLE_KEY…"**: add the key to Vercel and redeploy.
