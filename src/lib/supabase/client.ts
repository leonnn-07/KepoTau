import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Supabase client for Client Components. Uses the signed-in user's session. */
export function createClient() {
  browserClient ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  return browserClient;
}
