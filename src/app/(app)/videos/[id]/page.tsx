import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, ArrowLeft, Download, FileVideo, Pencil, Trash2 } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Alert, StatusBadge } from "@/components/ui";
import { getCompletionRule, getPreviewUrls, getVideo } from "@/lib/queries";
import {
  captionWithHashtags,
  COMPLETION_RULES,
  formatBytes,
  formatDateTime,
  formatTimeUntil,
  hashtagsText,
  RETENTION_HOURS,
} from "@/lib/videos";
import { DeleteButton } from "./delete-button";
import { PublicationControls } from "./publication-controls";

export const metadata: Metadata = { title: "Video" };

export default function VideoPage({ params }: PageProps<"/videos/[id]">) {
  return (
    <>
      <Link href="/videos" className="focus-ring mb-4 inline-flex items-center gap-1.5 rounded-lg text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Library
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <VideoDetail params={params} />
      </Suspense>
    </>
  );
}

async function VideoDetail({ params }: Pick<PageProps<"/videos/[id]">, "params">) {
  const { id } = await params;
  const video = await getVideo(id);
  const [{ videoUrl, posterUrl, videoError }, rule] = await Promise.all([getPreviewUrls(video), getCompletionRule()]);
  const archived = Boolean(video.file_deleted_at);
  const ruleLabel = COMPLETION_RULES.find((r) => r.value === rule)?.label ?? rule;
  const tags = hashtagsText(video.hashtags);

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={video.status} />
            {video.category && <span className="chip">{video.category}</span>}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-[1.75rem]">{video.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {!archived && (
            <a href={`/api/videos/${video.id}/download`} className="btn btn-primary" download={video.original_filename}>
              <Download className="size-4" /> Download
            </a>
          )}
          <Link href={`/videos/${video.id}/edit`} className="btn btn-ghost">
            <Pencil className="size-4" /> Edit
          </Link>
          <DeleteButton videoId={video.id} title={video.title} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <section aria-label="Preview" className="glass self-start overflow-hidden p-2 lg:sticky lg:top-8">
          {videoUrl ? (
            <video
              src={videoUrl}
              poster={posterUrl ?? undefined}
              controls
              playsInline
              preload="metadata"
              className="aspect-[9/16] max-h-[75vh] w-full rounded-[1rem] bg-black object-contain"
            />
          ) : (
            <div className="grid aspect-[9/16] max-h-[75vh] w-full place-items-center rounded-[1rem] bg-navy-950/60 p-6 text-center">
              <div className="flex flex-col items-center gap-3 text-muted">
                <FileVideo className="size-10 text-faint" />
                {archived ? (
                  <p className="text-sm">
                    The file was removed {formatDateTime(video.file_deleted_at)}.<br />
                    Captions and history are kept.
                  </p>
                ) : (
                  <p className="text-sm">Preview unavailable{videoError ? `: ${videoError}` : "."}</p>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-5">
          <section className="glass p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Caption</h2>
              <CopyButton text={captionWithHashtags(video)} label="Copy all" className="btn btn-primary btn-sm" />
            </div>
            {video.caption ? (
              <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink/90 [overflow-wrap:anywhere]">
                {video.caption}
              </p>
            ) : (
              <p className="text-sm text-faint">No caption.</p>
            )}
            <div className="mt-3">
              <CopyButton text={video.caption} label="Copy caption" />
            </div>

            <div className="mt-5 border-t border-white/[0.07] pt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-muted">Hashtags</h3>
                <CopyButton text={tags} label="Copy hashtags" />
              </div>
              {video.hashtags.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {video.hashtags.map((t) => (
                    <Link key={t} href={`/videos?q=${encodeURIComponent(t)}&status=all`} className="chip focus-ring hover:text-ink">
                      {t}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-faint">No hashtags.</p>
              )}
            </div>
          </section>

          <section className="glass p-5">
            <h2 className="mb-1 font-semibold">Publication</h2>
            <p className="mb-4 text-sm text-muted">
              The file is deleted {RETENTION_HOURS}h after it is posted on: <span className="text-ink">{ruleLabel}</span>.{" "}
              <Link href="/settings" className="text-accent hover:underline">
                Change
              </Link>
            </p>
            <PublicationControls
              videoId={video.id}
              instagramPostedAt={video.instagram_posted_at}
              tiktokPostedAt={video.tiktok_posted_at}
              locked={archived}
            />
            <div className="mt-4 space-y-2">
              {video.status === "posted" && video.delete_at && (
                <Alert tone="info">
                  <span className="flex items-start gap-2">
                    <Trash2 className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Publication complete {formatDateTime(video.posted_at)}. The stored file will be deleted{" "}
                      {formatDateTime(video.delete_at)} ({formatTimeUntil(video.delete_at)}). Download it now if you need a copy.
                    </span>
                  </span>
                </Alert>
              )}
              {video.cleanup_last_error && !archived && (
                <Alert tone="warning">
                  <span className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Last cleanup attempt failed ({video.cleanup_last_error}). It will be retried automatically.
                    </span>
                  </span>
                </Alert>
              )}
            </div>
          </section>

          <section className="glass p-5">
            <h2 className="mb-3 font-semibold">Details</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Detail label="Original file" value={video.original_filename} />
              <Detail label="Size" value={formatBytes(video.file_size)} />
              <Detail label="Uploaded" value={formatDateTime(video.created_at)} />
              <Detail label="Last updated" value={formatDateTime(video.updated_at)} />
              {archived && <Detail label="File removed" value={formatDateTime(video.file_deleted_at)} />}
            </dl>
            {video.notes && (
              <div className="mt-4 border-t border-white/[0.07] pt-4">
                <h3 className="mb-1 text-sm font-medium text-muted">Notes</h3>
                <p className="whitespace-pre-wrap text-sm text-ink/90 [overflow-wrap:anywhere]">{video.notes}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="truncate text-ink/90" title={value}>
        {value}
      </dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="skeleton aspect-[9/16] max-h-[75vh] rounded-[1.25rem]" />
      <div className="space-y-5">
        <div className="skeleton h-56 rounded-[1.25rem]" />
        <div className="skeleton h-48 rounded-[1.25rem]" />
      </div>
    </div>
  );
}
