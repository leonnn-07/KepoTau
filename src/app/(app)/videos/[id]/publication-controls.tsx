"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Undo2 } from "lucide-react";
import { InstagramIcon, TikTokIcon } from "@/components/ui";
import { formatDateTime, type Platform } from "@/lib/videos";
import { setPublication } from "../../video-actions";

type Props = {
  videoId: string;
  instagramPostedAt: string | null;
  tiktokPostedAt: string | null;
  locked: boolean;
};

const PLATFORMS: { key: Platform; label: string; Icon: typeof InstagramIcon; tone: string }[] = [
  { key: "instagram", label: "Instagram", Icon: InstagramIcon, tone: "text-instagram border-instagram/40 bg-instagram/15" },
  { key: "tiktok", label: "TikTok", Icon: TikTokIcon, tone: "text-tiktok border-tiktok/40 bg-tiktok/15" },
];

export function PublicationControls({ videoId, instagramPostedAt, tiktokPostedAt, locked }: Props) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<Platform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const postedAt = { instagram: instagramPostedAt, tiktok: tiktokPostedAt };

  function toggle(platform: Platform, posted: boolean) {
    if (!posted && !confirm(`Mark this video as not posted on ${platform === "instagram" ? "Instagram" : "TikTok"}?`)) {
      return;
    }
    setError(null);
    setBusy(platform);
    startTransition(async () => {
      const result = await setPublication(videoId, platform, posted);
      if (!result.ok) setError(result.error);
      setBusy(null);
    });
  }

  return (
    <div className="space-y-2.5">
      {PLATFORMS.map(({ key, label, Icon, tone }) => {
        const at = postedAt[key];
        const isBusy = pending && busy === key;
        return (
          <div key={key} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl border ${at ? tone : "border-white/10 text-faint"}`}>
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{label}</p>
              <p className="truncate text-xs text-muted">{at ? `Posted ${formatDateTime(at)}` : "Not posted yet"}</p>
            </div>
            {locked ? null : at ? (
              <button
                type="button"
                onClick={() => toggle(key, false)}
                disabled={pending}
                className="btn btn-ghost btn-sm"
                aria-label={`Undo ${label} publication`}
              >
                {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
                <span className="hidden sm:inline">Undo</span>
              </button>
            ) : (
              <button type="button" onClick={() => toggle(key, true)} disabled={pending} className="btn btn-primary btn-sm">
                {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Mark posted
              </button>
            )}
          </div>
        );
      })}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
