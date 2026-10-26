import type { CompletionRule, VideoRow, VideoStatus } from "@/lib/database.types";

export const STATUS_LABELS: Record<VideoStatus, string> = {
  ready: "In stock",
  partially_posted: "Partially posted",
  posted: "Posted",
  archived: "Archived",
};

export const COMPLETION_RULES: { value: CompletionRule; label: string; description: string }[] = [
  {
    value: "both",
    label: "Instagram and TikTok",
    description: "Complete once the video is marked posted on both platforms.",
  },
  {
    value: "either",
    label: "Instagram or TikTok",
    description: "Complete as soon as it is marked posted on either platform.",
  },
  {
    value: "instagram",
    label: "Instagram only",
    description: "Complete once it is marked posted on Instagram.",
  },
  {
    value: "tiktok",
    label: "TikTok only",
    description: "Complete once it is marked posted on TikTok.",
  },
];

export const RETENTION_HOURS = 24;

export type Platform = "instagram" | "tiktok";

/** Normalises free-form input ("#a b, #c") into a deduplicated list of hashtags. */
export function parseHashtags(input: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of input.split(/[\s,]+/)) {
    const word = raw.replace(/^#+/, "").trim();
    if (!word || !/^[\p{L}\p{N}_.]+$/u.test(word) || word.length > 100) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(`#${word}`);
    if (tags.length >= 60) break;
  }
  return tags;
}

export function hashtagsText(tags: string[]) {
  return tags.join(" ");
}

/** Caption followed by hashtags, ready to paste into Instagram or TikTok. */
export function captionWithHashtags(video: Pick<VideoRow, "caption" | "hashtags">) {
  return [video.caption.trim(), hashtagsText(video.hashtags)].filter(Boolean).join("\n\n");
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** i;
  return `${value >= 10 || i === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

/** "in 5h 20m", "in 12m", "now" */
export function formatTimeUntil(iso: string, now = Date.now()) {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "pending cleanup";
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `in ${hours}h ${rest}m` : `in ${hours}h`;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
