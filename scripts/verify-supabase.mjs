// Checks that the configured Supabase project is reachable and set up for Kepotau.
// Usage: npm run verify:supabase   (reads .env.local / .env via Node's --env-file)
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.CRON_SECRET;

let failures = 0;
const ok = (msg) => console.log(`  ✔ ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`  ✘ ${msg}`);
};
const warn = (msg) => console.log(`  ! ${msg}`);

console.log("Kepotau · Supabase verification\n");

if (!url || !anonKey) {
  fail("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set (.env.local).");
  process.exit(1);
}
ok(`Project URL: ${url}`);

const anon = createClient(url, anonKey, { auth: { persistSession: false } });

// 1. Auth reachable
try {
  const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anonKey } });
  if (res.ok) {
    const settings = await res.json();
    ok("Auth API reachable with the anon/publishable key");
    if (!settings.disable_signup) {
      warn("Public sign-ups are enabled. Consider disabling them (Authentication → Sign In / Providers).");
    }
  } else fail(`Auth API returned ${res.status}. Check the URL and anon key.`);
} catch (e) {
  fail(`Could not reach Supabase: ${e.message}`);
}

// 2. Tables exist (RLS returns no rows for anon, but no error)
for (const table of ["videos", "user_settings"]) {
  const { error } = await anon.from(table).select("*").limit(0);
  if (!error) ok(`Table public.${table} exists`);
  else if (error.code === "42501") ok(`Table public.${table} exists (anon access denied, as expected)`);
  else fail(`Table public.${table}: ${error.message} — run the SQL migration.`);
}

// 3. Cleanup function exists and is NOT callable by anon
{
  const { error } = await anon.rpc("claim_videos_for_cleanup", { p_limit: 1 });
  if (error?.code === "42501" || /permission denied/i.test(error?.message ?? "")) {
    ok("Cleanup functions installed and locked to the service role");
  } else if (!error) fail("claim_videos_for_cleanup is callable by anon! Re-run the migration (revoke statements).");
  else fail(`Cleanup functions: ${error.message} — run the SQL migration.`);
}

// 4. Storage bucket (needs the service role key)
if (!serviceKey) {
  fail("SUPABASE_SERVICE_ROLE_KEY is not set (required for the cleanup job).");
} else {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: bucket, error } = await admin.storage.getBucket("video-stock");
  if (error || !bucket) fail(`Bucket "video-stock" not found: ${error?.message ?? "missing"} — run the SQL migration.`);
  else if (bucket.public) fail('Bucket "video-stock" is public. It must be private.');
  else {
    ok(`Bucket "video-stock" exists and is private (limit: ${bucket.file_size_limit ? `${Math.round(bucket.file_size_limit / 1048576)} MB` : "project default"})`);
  }
  const { error: rpcError } = await admin.from("videos").select("id", { head: true, count: "exact" });
  if (rpcError) fail(`Service role key cannot read public.videos: ${rpcError.message}`);
  else ok("Service role key works");
}

// 5. Cron secret
if (!cronSecret || cronSecret.length < 16) fail("CRON_SECRET must be set to a random string of at least 16 characters.");
else ok("CRON_SECRET is set");

console.log(failures ? `\n${failures} problem(s) found.` : "\nAll checks passed. Supabase is connected.");
process.exit(failures ? 1 : 0);
