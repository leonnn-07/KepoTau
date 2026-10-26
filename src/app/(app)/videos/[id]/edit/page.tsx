import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { getCategories, getVideo } from "@/lib/queries";
import { hashtagsText } from "@/lib/videos";
import { EditForm } from "./edit-form";

export const metadata: Metadata = { title: "Edit video" };

export default function EditVideoPage({ params }: PageProps<"/videos/[id]/edit">) {
  return (
    <div className="mx-auto max-w-2xl">
      <Suspense fallback={<div className="skeleton h-[36rem] rounded-[1.25rem]" />}>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}

async function Editor({ params }: Pick<PageProps<"/videos/[id]/edit">, "params">) {
  const { id } = await params;
  const [video, categories] = await Promise.all([getVideo(id), getCategories()]);
  return (
    <>
      <Link
        href={`/videos/${video.id}`}
        className="focus-ring mb-4 inline-flex items-center gap-1.5 rounded-lg text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Back to video
      </Link>
      <PageHeader title="Edit video" description={video.original_filename} />
      <EditForm
        videoId={video.id}
        categories={categories}
        defaults={{
          title: video.title,
          caption: video.caption,
          hashtags: hashtagsText(video.hashtags),
          notes: video.notes,
          category: video.category ?? "",
        }}
      />
    </>
  );
}
