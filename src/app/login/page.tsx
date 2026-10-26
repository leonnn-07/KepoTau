import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-6 flex justify-center">
          <Logo variant="stacked" className="size-56" />
        </div>
        <div className="glass p-6 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage your video stock.</p>
          <div className="mt-6">
            {isSupabaseConfigured() ? (
              <Suspense fallback={<div className="skeleton h-48" />}>
                <LoginFormWithNext searchParams={searchParams} />
              </Suspense>
            ) : (
              <NotConfigured />
            )}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-faint">
          Accounts are created by the owner in the Supabase dashboard.
        </p>
      </div>
    </main>
  );
}

async function LoginFormWithNext({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/videos";
  return <LoginForm next={next} />;
}

function NotConfigured() {
  return (
    <div className="space-y-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
      <p className="font-medium">Supabase is not configured</p>
      <p className="text-amber-100/80">
        Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
        <code className="font-mono">.env.local</code> (or in Vercel), then restart the app. See the README for
        details.
      </p>
    </div>
  );
}
