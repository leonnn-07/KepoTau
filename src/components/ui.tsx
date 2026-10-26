import type { ReactNode } from "react";
import { Archive, CheckCircle2, CircleDashed, Clock3 } from "lucide-react";
import type { VideoRow, VideoStatus } from "@/lib/database.types";
import { STATUS_LABELS } from "@/lib/videos";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const STATUS_STYLES: Record<VideoStatus, string> = {
  ready: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  partially_posted: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  posted: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  archived: "border-slate-400/25 bg-slate-400/10 text-slate-300",
};

const STATUS_ICONS = {
  ready: CircleDashed,
  partially_posted: Clock3,
  posted: CheckCircle2,
  archived: Archive,
} as const;

export function StatusBadge({ status }: { status: VideoStatus }) {
  const Icon = STATUS_ICONS[status];
  return (
    <span className={`chip ${STATUS_STYLES[status]}`}>
      <Icon className="size-3.5" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function InstagramIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 3c.3 2.2 1.6 3.7 3.9 3.9v3.1c-1.4.1-2.7-.3-3.9-1.1v6.2c0 3.7-3.2 6.3-6.8 5.6-2.4-.5-4.2-2.6-4.3-5-.2-3.4 2.8-6.1 6.2-5.6v3.2c-1.6-.4-3.1.8-3 2.4.1 1.2 1.1 2.1 2.3 2.1 1.4 0 2.3-1 2.3-2.5V3h3.3z" />
    </svg>
  );
}

export function PlatformDots({ video }: { video: Pick<VideoRow, "instagram_posted_at" | "tiktok_posted_at"> }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        title={video.instagram_posted_at ? "Posted on Instagram" : "Not on Instagram yet"}
        className={`grid size-6 place-items-center rounded-full border ${
          video.instagram_posted_at
            ? "border-instagram/40 bg-instagram/15 text-instagram"
            : "border-white/10 text-faint/70"
        }`}
      >
        <InstagramIcon className="size-3.5" />
        <span className="sr-only">{video.instagram_posted_at ? "Instagram: posted" : "Instagram: not posted"}</span>
      </span>
      <span
        title={video.tiktok_posted_at ? "Posted on TikTok" : "Not on TikTok yet"}
        className={`grid size-6 place-items-center rounded-full border ${
          video.tiktok_posted_at ? "border-tiktok/40 bg-tiktok/15 text-tiktok" : "border-white/10 text-faint/70"
        }`}
      >
        <TikTokIcon className="size-3.5" />
        <span className="sr-only">{video.tiktok_posted_at ? "TikTok: posted" : "TikTok: not posted"}</span>
      </span>
    </span>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="glass flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-accent">
        {icon}
      </span>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "warning" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-red-400/30 bg-red-500/10 text-red-100",
    warning: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    info: "border-accent/30 bg-accent/10 text-indigo-100",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-3.5 py-2.5 text-sm ${styles}`}>
      {children}
    </div>
  );
}
