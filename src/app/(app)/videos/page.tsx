import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Archive, CheckCircle2, CircleDashed, Clapperboard, Clock3, SearchX, UploadCloud } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";
import { VideoCard } from "@/components/video-card";
import type { VideoStatus } from "@/lib/database.types";
import { getCategories, getThumbnailUrls, getVideoStats, listVideos, type VideoFilters } from "@/lib/queries";
import { Filters } from "./filters";

export const metadata: Metadata = { title: "Library" };

const STATUSES = ["active", "all", "ready", "partially_posted", "posted", "archived"] as const;

export default function VideosPage({ searchParams }: PageProps<"/videos">) {
  return (
    <>
      <PageHeader
        title="Video stock"
        description="Everything ready to post, with captions one tap away."
        actions={
          <Link href="/upload" className="btn btn-primary">
            <UploadCloud className="size-4" /> Upload video
          </Link>
        }
      />
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
      <Suspense fallback={<LibrarySkeleton />}>
        <Library searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Stats() {
  const stats = await getVideoStats();
  const items = [
    { label: "In stock", value: stats.ready, icon: CircleDashed, tone: "text-sky-300" },
    { label: "Partially posted", value: stats.partial, icon: Clock3, tone: "text-amber-300" },
    { label: "Deleting within 24h", value: stats.posted, icon: CheckCircle2, tone: "text-violet-300" },
    { label: "Archived", value: stats.archived, icon: Archive, tone: "text-slate-300" },
  ];
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="glass flex items-center gap-3 p-4">
          <span className={`grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 ${tone}`}>
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-xl font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

async function Library({ searchParams }: Pick<PageProps<"/videos">, "searchParams">) {
  const params = await searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const statusParam = str(params.status);
  const filters: VideoFilters = {
    q: str(params.q).slice(0, 200),
    category: str(params.category),
    status: (STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as VideoStatus | "active" | "all")
      : "active",
    page: Number(str(params.page)) || 1,
  };

  const [{ videos, total, page, pageCount }, categories] = await Promise.all([
    listVideos(filters),
    getCategories(),
  ]);
  const thumbs = await getThumbnailUrls(videos);
  const filtered = Boolean(filters.q || filters.category || filters.status !== "active");

  const pageHref = (p: number) => {
    const qs = new URLSearchParams();
    if (filters.q) qs.set("q", filters.q);
    if (filters.category) qs.set("category", filters.category);
    if (filters.status !== "active") qs.set("status", String(filters.status));
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/videos?${s}` : "/videos";
  };

  return (
    <>
      <Filters
        q={filters.q ?? ""}
        category={filters.category ?? ""}
        status={String(filters.status)}
        categories={categories}
      />
      {videos.length === 0 ? (
        filtered ? (
          <EmptyState icon={<SearchX className="size-6" />} title="No matching videos">
            Try a different search term or clear the filters.
          </EmptyState>
        ) : (
          <EmptyState icon={<Clapperboard className="size-6" />} title="Your stock is empty">
            <p>Upload your first MP4 from your desktop to get started.</p>
            <Link href="/upload" className="btn btn-primary mt-5">
              <UploadCloud className="size-4" /> Upload video
            </Link>
          </EmptyState>
        )
      ) : (
        <>
          <p className="mb-3 text-xs text-faint">
            {total} video{total === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} thumbUrl={thumbs.get(video.id)} />
            ))}
          </div>
          {pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className="btn btn-ghost btn-sm">
                  Previous
                </Link>
              )}
              <span className="text-sm text-muted">
                Page {page} of {pageCount}
              </span>
              {page < pageCount && (
                <Link href={pageHref(page + 1)} className="btn btn-ghost btn-sm">
                  Next
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}

function StatsSkeleton() {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="skeleton h-[74px] rounded-[1.25rem]" />
      ))}
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <>
      <div className="skeleton mb-6 h-16 rounded-[1.25rem]" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton aspect-[9/16] max-h-[26rem] rounded-[1.25rem]" />
        ))}
      </div>
    </>
  );
}
