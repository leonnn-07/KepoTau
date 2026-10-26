"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { MetadataFields, type MetadataDefaults } from "@/components/metadata-fields";
import { Alert } from "@/components/ui";
import { updateVideo, type FormState } from "../../../video-actions";

export function EditForm({
  videoId,
  defaults,
  categories,
}: {
  videoId: string;
  defaults: MetadataDefaults;
  categories: string[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateVideo.bind(null, videoId), {});

  return (
    <form action={action} className="glass space-y-5 p-5 sm:p-6">
      <MetadataFields defaults={defaults} categories={categories} errors={state.fieldErrors} disabled={pending} />
      {state.error && <Alert>{state.error}</Alert>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={`/videos/${videoId}`} className="btn btn-ghost">
          Cancel
        </Link>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save changes
        </button>
      </div>
    </form>
  );
}
