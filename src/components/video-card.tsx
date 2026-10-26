import Link from "next/link";
import { Film, Trash2 } from "lucide-react";
import type { VideoRow } from "@/lib/database.types";
import { formatBytes, formatDate, formatTimeUntil } from "@/lib/videos";
import { PlatformDots, StatusBadge } from "@/components/ui";

export function VideoThumb({ url, title, archived }: { url?: string; title: string; archived?: boolean }) {
  return (
    <div className="relative aspect-[9/16] max-h-80 w-full overflow-hidden rounded-t-[1.2rem] bg-gradient-to-br from-navy-800 to-navy-950">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived storage URL
        <img src={url} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : (
        <div className="grid size-full place-items-center text-faint">
          <div className="flex flex-col items-center gap-2">
            <Film className="size-8" aria-hidden />
            <span className="sr-only">{title}</span>
            {archived && <span className="text-xs">File removed</span>}
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-950/80 to-transparent" />
    </div>
  );
}

export function VideoCard({ video, thumbUrl }: { video: VideoRow; thumbUrl?: string }) {
  return (
    <Link
      href={`/videos/${video.id}`}
      className="glass glass-hover focus-ring group flex animate-fade-up flex-col overflow-hidden"
    >
      <div className="relative">
        <VideoThumb url={thumbUrl} title={video.title} archived={Boolean(video.file_deleted_at)} />
        <div className="absolute left-3 top-3 rounded-full bg-navy-950/75 backdrop-blur-sm">
          <StatusBadge status={video.status} />
        </div>
        <div className="absolute bottom-3 right-3 rounded-full bg-navy-950/60 p-0.5 backdrop-blur-sm">
          <PlatformDots video={video} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-medium leading-snug">{video.title}</h3>
        {video.caption && <p className="line-clamp-2 text-sm text-muted">{video.caption}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-faint">
          {video.category && <span className="chip py-0.5">{video.category}</span>}
          <span>{formatDate(video.created_at)}</span>
          <span>{formatBytes(video.file_size)}</span>
        </div>
        {video.status === "posted" && video.delete_at && (
          <p className="flex items-center gap-1.5 text-xs text-violet-200/90">
            <Trash2 className="size-3.5" aria-hidden />
            File deletes {formatTimeUntil(video.delete_at)}
          </p>
        )}
      </div>
    </Link>
  );
}
