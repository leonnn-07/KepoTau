import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Archive, History as HistoryIcon, Trash2 } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { EmptyState, InstagramIcon, PageHeader, StatusBadge, TikTokIcon } from "@/components/ui";
import { getThumbnailUrls, listPublished } from "@/lib/queries";
import { captionWithHashtags, formatDateTime, formatTimeUntil } from "@/lib/videos";
import { VideoThumb } from "@/components/video-card";

export const metadata: Metadata = { title: "Published history" };

export default function HistoryPage({ searchParams }: PageProps<"/history">) {
  return (
    <>
      <PageHeader
        title="Published history"
        description="Every video you've posted. Captions and hashtags are kept even after the file is deleted."
      />
      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton h-32 rounded-[1.25rem]" />
            ))}
          </div>
        }
      >
        <HistoryList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function HistoryList({ searchParams }: Pick<PageProps<"/history">, "searchParams">) {
  const params = await searchParams;
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;
  const { videos, total, pageCount } = await listPublished(page);
  const thumbs = await getThumbnailUrls(videos);

  if (videos.length === 0) {
    return (
      <EmptyState icon={<HistoryIcon className="size-6" />} title="Nothing published yet">
        Mark a video as posted on Instagram or TikTok and it will appear here.
      </EmptyState>
    );
  }

  return (
    <>
      <p className="mb-3 text-xs text-faint">
        {total} published video{total === 1 ? "" : "s"}
      </p>
      <ol className="space-y-3">
        {videos.map((video) => (
          <li key={video.id} className="glass flex animate-fade-up gap-4 overflow-hidden p-3 sm:p-4">
            <Link href={`/videos/${video.id}`} className="focus-ring w-20 shrink-0 overflow-hidden rounded-[1.2rem] sm:w-24">
              <VideoThumb url={thumbs.get(video.id)} title={video.title} archived={Boolean(video.file_deleted_at)} />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link href={`/videos/${video.id}`} className="focus-ring min-w-0 rounded">
                  <h2 className="truncate font-medium hover:text-accent">{video.title}</h2>
                </Link>
                <StatusBadge status={video.status} />
              </div>
              <ul className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2">
                <li className="flex items-center gap-1.5">
                  <InstagramIcon className={`size-3.5 ${video.instagram_posted_at ? "text-instagram" : "text-faint"}`} />
                  {video.instagram_posted_at ? formatDateTime(video.instagram_posted_at) : "Not on Instagram"}
                </li>
                <li className="flex items-center gap-1.5">
                  <TikTokIcon className={`size-3.5 ${video.tiktok_posted_at ? "text-tiktok" : "text-faint"}`} />
                  {video.tiktok_posted_at ? formatDateTime(video.tiktok_posted_at) : "Not on TikTok"}
                </li>
                {video.file_deleted_at ? (
                  <li className="flex items-center gap-1.5 sm:col-span-2">
                    <Archive className="size-3.5 text-faint" /> File removed {formatDateTime(video.file_deleted_at)}
                  </li>
                ) : video.delete_at ? (
                  <li className="flex items-center gap-1.5 text-violet-200/90 sm:col-span-2">
                    <Trash2 className="size-3.5" /> File deletes {formatDateTime(video.delete_at)} (
                    {formatTimeUntil(video.delete_at)})
                  </li>
                ) : null}
              </ul>
              {video.caption && <p className="mt-2 line-clamp-2 text-sm text-ink/80">{video.caption}</p>}
              <div className="mt-3">
                <CopyButton text={captionWithHashtags(video)} label="Copy caption + hashtags" />
              </div>
            </div>
          </li>
        ))}
      </ol>
      {pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link href={`/history?page=${page - 1}`} className="btn btn-ghost btn-sm">
              Previous
            </Link>
          )}
          <span className="text-sm text-muted">
            Page {page} of {pageCount}
          </span>
          {page < pageCount && (
            <Link href={`/history?page=${page + 1}`} className="btn btn-ghost btn-sm">
              Next
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
