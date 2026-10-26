-- =============================================================================
-- Kepotau: schedule the automatic file cleanup with Supabase Cron.
--
-- Run this in the Supabase SQL Editor AFTER the app is deployed on Vercel.
-- Replace the two placeholder values below before running it:
--
--   https://YOUR-APP.vercel.app    -> your production URL (no trailing slash)
--   REPLACE_WITH_YOUR_CRON_SECRET  -> the same value as CRON_SECRET in Vercel
--
-- Every 15 minutes Supabase Cron POSTs to /api/cron/cleanup. The endpoint
-- deletes stored files whose delete_at has passed, through the Storage API,
-- and records failures for retry with backoff.
-- =============================================================================

-- 1. Extensions (also available under Dashboard -> Integrations -> Cron / pg_net).
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- 2. Store the endpoint URL and secret in Vault (encrypted at rest).
--    To change a value later, use vault.update_secret(id, new_value).
select vault.create_secret('https://YOUR-APP.vercel.app', 'kepotau_app_url', 'Kepotau production URL')
where not exists (select 1 from vault.secrets where name = 'kepotau_app_url');

select vault.create_secret('REPLACE_WITH_YOUR_CRON_SECRET', 'kepotau_cron_secret', 'Kepotau CRON_SECRET')
where not exists (select 1 from vault.secrets where name = 'kepotau_cron_secret');

-- 3. Schedule (re-running replaces the existing job with the same name).
select cron.schedule(
  'kepotau-cleanup-expired-videos',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'kepotau_app_url')
           || '/api/cron/cleanup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'kepotau_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);

-- Useful checks:
--   select * from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 20;
--   select id, status_code, content from net._http_response order by created desc limit 20;
--
-- To stop the schedule:
--   select cron.unschedule('kepotau-cleanup-expired-videos');
