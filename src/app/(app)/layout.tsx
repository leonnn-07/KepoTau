import Link from "next/link";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { BottomNav, SideNav } from "@/components/nav";
import { requireUser } from "@/lib/auth";
import { signOut } from "./actions";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[90rem]">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 p-5 lg:flex">
        <Link href="/videos" className="focus-ring rounded-lg px-1 pt-1">
          <Logo className="h-12 w-auto" />
        </Link>
        <SideNav />
        <div className="mt-auto">
          <Suspense fallback={<div className="skeleton h-16" />}>
            <AccountCard />
          </Suspense>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-strong sticky top-0 z-30 flex items-center justify-between border-x-0 border-t-0 px-4 py-3 lg:hidden">
          <Link href="/videos" className="focus-ring rounded-lg">
            <Logo className="h-9 w-auto" />
          </Link>
          <form action={signOut}>
            <button type="submit" className="btn btn-ghost btn-sm" aria-label="Sign out">
              <LogOut className="size-4" />
            </button>
          </form>
        </header>
        <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}

async function AccountCard() {
  const { user } = await requireUser();
  const email = user.email ?? "Signed in";
  return (
    <div className="glass flex items-center gap-3 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent/40 to-accent-2/40 text-sm font-semibold uppercase">
        {email.slice(0, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={email}>
          {email}
        </p>
        <form action={signOut}>
          <button type="submit" className="focus-ring rounded text-xs text-faint transition-colors hover:text-ink">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
