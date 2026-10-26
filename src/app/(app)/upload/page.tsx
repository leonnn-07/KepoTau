import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { getCategories } from "@/lib/queries";
import { Uploader } from "./uploader";

export const metadata: Metadata = { title: "Upload" };

export default function UploadPage() {
  return (
    <>
      <PageHeader
        title="Upload video"
        description="MP4 files are stored privately in Supabase Storage. Add the caption now so it's ready on your phone."
      />
      <Suspense fallback={<div className="skeleton h-[32rem] rounded-[1.25rem]" />}>
        <UploaderWithCategories />
      </Suspense>
    </>
  );
}

async function UploaderWithCategories() {
  const categories = await getCategories();
  return <Uploader categories={categories} />;
}
