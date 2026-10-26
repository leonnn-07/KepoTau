"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tus from "tus-js-client";
import { CheckCircle2, FileVideo, Loader2, RotateCcw, UploadCloud, X } from "lucide-react";
import { MetadataFields } from "@/components/metadata-fields";
import { Alert } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, SUPABASE_ANON_KEY, SUPABASE_URL, VIDEO_BUCKET } from "@/lib/env";
import { formatBytes } from "@/lib/videos";
import { createVideo } from "../video-actions";

type Phase = "idle" | "preparing" | "uploading" | "saving" | "done";

type Uploaded = { id: string; storagePath: string; thumbnailPath: string | null };

const CHUNK_SIZE = 6 * 1024 * 1024; // Supabase resumable uploads require 6MB chunks.

function isMp4(file: File) {
  return file.type === "video/mp4" || (!file.type && file.name.toLowerCase().endsWith(".mp4"));
}

/** Grabs a frame from the local file to use as a poster image. Best effort. */
function captureThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    const done = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      resolve(blob);
    };
    const timeout = setTimeout(() => done(null), 10_000);
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onerror = () => done(null);
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      video.currentTime = Math.max(0.1, Math.min(1.5, duration / 3));
    };
    video.onseeked = () => {
      const longest = Math.max(video.videoWidth, video.videoHeight);
      if (!longest) return done(null);
      const scale = Math.min(1, 720 / longest);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return done(null);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => done(blob), "image/jpeg", 0.82);
    };
    video.src = url;
  });
}

function describeTusError(err: Error) {
  const detailed = err as tus.DetailedError;
  const status = detailed.originalResponse?.getStatus?.();
  let body = "";
  try {
    body = detailed.originalResponse?.getBody?.() ?? "";
  } catch {
    /* ignore */
  }
  if (status === 413 || /maximum allowed size|too large/i.test(body)) {
    return "The file is larger than your Supabase upload limit. Raise it in Storage settings or upload a smaller file.";
  }
  if (status === 401 || status === 403) {
    return "Storage refused the upload. Check that you are signed in and that the storage policies from the migration are installed.";
  }
  if (status === 404 && /bucket/i.test(body)) {
    return "The “video-stock” bucket does not exist. Run the SQL migration in Supabase.";
  }
  if (!status) return "Network error while uploading. Check your connection and try again — the upload resumes where it stopped.";
  return `Upload failed (${status})${body ? `: ${body.slice(0, 200)}` : ""}`;
}

export function Uploader({ categories }: { categories: string[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<tus.Upload | null>(null);
  const rejectRef = useRef<((err: Error) => void) | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string>("");
  const [uploaded, setUploaded] = useState<Uploaded | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState(false);

  const busy = phase === "preparing" || phase === "uploading" || phase === "saving";

  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function selectFile(next: File | undefined | null) {
    if (!next || busy) return;
    setError(null);
    if (!isMp4(next)) {
      setError("Only MP4 videos are supported.");
      return;
    }
    if (next.size > MAX_UPLOAD_BYTES) {
      setError(`This file is ${formatBytes(next.size)}. The maximum is ${MAX_UPLOAD_MB} MB.`);
      return;
    }
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
    setVideoId(crypto.randomUUID());
    setUploaded(null);
    setProgress(0);
    setPhase("idle");
    const title = formRef.current?.elements.namedItem("title") as HTMLInputElement | null;
    if (title && !title.value) title.value = next.name.replace(/\.mp4$/i, "").replace(/[_-]+/g, " ").trim();
  }

  function clearFile() {
    if (busy) return;
    setFile(null);
    setPreviewUrl(null);
    setUploaded(null);
    setProgress(0);
    setPhase("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function uploadFile(f: File, id: string): Promise<Uploaded> {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Your session has expired. Please sign in again.");
    const userId = userData.user.id;
    const storagePath = `${userId}/${id}.mp4`;

    setPhase("preparing");
    const thumbnail = await captureThumbnail(f);

    setPhase("uploading");
    await new Promise<void>((resolve, reject) => {
      const upload = new tus.Upload(f, {
        endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: { "x-upsert": "true" },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        chunkSize: CHUNK_SIZE,
        metadata: {
          bucketName: VIDEO_BUCKET,
          objectName: storagePath,
          contentType: "video/mp4",
          cacheControl: "3600",
        },
        // Fetch a fresh token for every request so long uploads survive token refresh.
        onBeforeRequest: async (req) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) req.setHeader("authorization", `Bearer ${token}`);
          req.setHeader("apikey", SUPABASE_ANON_KEY);
        },
        onProgress: (sent, total) => setProgress(total ? Math.round((sent / total) * 100) : 0),
        onSuccess: () => resolve(),
        onError: (err) => reject(new Error(describeTusError(err))),
      });
      uploadRef.current = upload;
      rejectRef.current = reject;
      upload
        .findPreviousUploads()
        .then((previous) => {
          if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
          upload.start();
        })
        .catch(() => upload.start());
    });
    uploadRef.current = null;
    rejectRef.current = null;

    let thumbnailPath: string | null = null;
    if (thumbnail) {
      const path = `${userId}/${id}.jpg`;
      const { error: thumbError } = await supabase.storage
        .from(VIDEO_BUCKET)
        .upload(path, thumbnail, { contentType: "image/jpeg", upsert: true });
      if (!thumbError) thumbnailPath = path;
    }

    return { id, storagePath, thumbnailPath };
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || busy) return;
    setError(null);
    setFieldErrors({});
    const form = new FormData(e.currentTarget);

    try {
      const stored = uploaded ?? (await uploadFile(file, videoId));
      setUploaded(stored);

      setPhase("saving");
      const result = await createVideo({
        id: stored.id,
        storagePath: stored.storagePath,
        thumbnailPath: stored.thumbnailPath,
        originalFilename: file.name,
        fileSize: file.size,
        title: String(form.get("title") ?? ""),
        caption: String(form.get("caption") ?? ""),
        hashtags: String(form.get("hashtags") ?? ""),
        notes: String(form.get("notes") ?? ""),
        category: String(form.get("category") ?? ""),
      });
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        throw new Error(result.error);
      }
      setPhase("done");
      router.push(`/videos/${stored.id}`);
    } catch (err) {
      uploadRef.current = null;
      rejectRef.current = null;
      setPhase("idle");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function cancelUpload() {
    const upload = uploadRef.current;
    if (!upload) return;
    await upload.abort(true).catch(() => undefined);
    setProgress(0);
    rejectRef.current?.(new Error("Upload cancelled."));
    rejectRef.current = null;
  }

  const statusText =
    phase === "preparing"
      ? "Preparing…"
      : phase === "uploading"
        ? `Uploading ${progress}%`
        : phase === "saving"
          ? "Saving details…"
          : phase === "done"
            ? "Done"
            : uploaded
              ? "Save video"
              : "Upload video";

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        {file && previewUrl ? (
          <div className="glass overflow-hidden p-2">
            <video
              src={previewUrl}
              controls
              muted
              playsInline
              className="aspect-[9/16] max-h-[60vh] w-full rounded-[1rem] bg-black object-contain"
            />
            <div className="flex items-center gap-3 px-2 pb-1 pt-3">
              <FileVideo className="size-5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted">{formatBytes(file.size)}</p>
              </div>
              {!busy && phase !== "done" && (
                <button type="button" onClick={clearFile} className="btn btn-ghost btn-sm" aria-label="Remove file">
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              selectFile(e.dataTransfer.files?.[0]);
            }}
            className={`glass flex aspect-[9/16] max-h-[60vh] cursor-pointer flex-col items-center justify-center gap-3 border-dashed p-6 text-center transition-colors focus-within:border-accent/60 ${
              dragging ? "border-accent/70 bg-accent/10" : "hover:border-white/20"
            }`}
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-accent/30 to-accent-2/30 text-ink">
              <UploadCloud className="size-6" />
            </span>
            <span className="font-medium">Drop an MP4 here</span>
            <span className="text-sm text-muted">or click to browse · up to {MAX_UPLOAD_MB} MB</span>
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,.mp4"
              className="sr-only"
              onChange={(e) => selectFile(e.target.files?.[0])}
            />
          </label>
        )}

        {(phase === "uploading" || phase === "saving" || phase === "done" || uploaded) && (
          <div className="glass p-4" aria-live="polite">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                {phase === "done" || (uploaded && phase === "idle") ? (
                  <CheckCircle2 className="size-4 text-emerald-300" />
                ) : (
                  <Loader2 className="size-4 animate-spin text-accent" />
                )}
                {uploaded && phase === "idle" ? "File uploaded" : statusText}
              </span>
              <span className="tabular-nums text-muted">{uploaded ? 100 : progress}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-white/[0.06]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={uploaded ? 100 : progress}
              aria-label="Upload progress"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#5b6cff] to-[#a78bfa] transition-[width] duration-300"
                style={{ width: `${uploaded ? 100 : progress}%` }}
              />
            </div>
            {phase === "uploading" && (
              <button type="button" onClick={cancelUpload} className="btn btn-ghost btn-sm mt-3">
                <X className="size-4" /> Cancel upload
              </button>
            )}
          </div>
        )}
      </div>

      <div className="glass space-y-5 p-5 sm:p-6">
        <MetadataFields categories={categories} errors={fieldErrors} disabled={busy || phase === "done"} />
        {error && <Alert>{error}</Alert>}
        <div className="flex justify-end">
          <button type="submit" disabled={!file || busy || phase === "done"} className="btn btn-primary w-full sm:w-auto">
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : error && file ? (
              <RotateCcw className="size-4" />
            ) : (
              <UploadCloud className="size-4" />
            )}
            {error && file && !busy ? (uploaded ? "Retry save" : "Retry upload") : statusText}
          </button>
        </div>
      </div>
    </form>
  );
}
