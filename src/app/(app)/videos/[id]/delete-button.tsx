"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteVideo } from "../../video-actions";

export function DeleteButton({ videoId, title }: { videoId: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!confirm(`Permanently delete “${title}” and its stored file? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteVideo(videoId);
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <>
      <button type="button" onClick={onClick} disabled={pending} className="btn btn-danger">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        Delete
      </button>
      {error && (
        <p role="alert" className="basis-full text-sm text-red-300">
          {error}
        </p>
      )}
    </>
  );
}
