"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Clapperboard, History, Settings, UploadCloud } from "lucide-react";

const ITEMS = [
  { href: "/videos", label: "Library", icon: Clapperboard },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

type IsActive = (href: string) => boolean;
const NONE_ACTIVE: IsActive = () => false;

function activeFor(pathname: string): IsActive {
  return (href) => pathname === href || pathname.startsWith(`${href}/`);
}

// usePathname() is request data, so the highlighted state streams in behind
// Suspense while the static links render immediately.
function WithPathname({ render }: { render: (isActive: IsActive) => React.ReactNode }) {
  return <>{render(activeFor(usePathname()))}</>;
}

export function SideNav() {
  return (
    <Suspense fallback={<SideNavLinks isActive={NONE_ACTIVE} />}>
      <WithPathname render={(isActive) => <SideNavLinks isActive={isActive} />} />
    </Suspense>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={<BottomNavLinks isActive={NONE_ACTIVE} />}>
      <WithPathname render={(isActive) => <BottomNavLinks isActive={isActive} />} />
    </Suspense>
  );
}

function SideNavLinks({ isActive }: { isActive: IsActive }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`focus-ring group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-white/[0.08] text-ink shadow-[inset_0_1px_0_0_rgb(255_255_255/0.06)]"
                : "text-muted hover:bg-white/[0.04] hover:text-ink"
            }`}
          >
            <Icon
              className={`size-[18px] transition-colors ${active ? "text-accent" : "text-faint group-hover:text-muted"}`}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function BottomNavLinks({ isActive }: { isActive: IsActive }) {
  return (
    <nav
      aria-label="Main"
      className="glass-strong fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`focus-ring flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-ink" : "text-faint hover:text-muted"
                }`}
              >
                <span
                  className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${
                    active ? "bg-accent/20 text-accent" : ""
                  }`}
                >
                  <Icon className="size-[18px]" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
