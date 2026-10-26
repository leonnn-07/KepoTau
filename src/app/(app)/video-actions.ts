"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { CompletionRule } from "@/lib/database.types";
import { MAX_UPLOAD_BYTES, VIDEO_BUCKET } from "@/lib/env";
import { COMPLETION_RULES, parseHashtags, UUID_RE, type Platform } from "@/lib/videos";

export type ActionResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

type Metadata = {
  title: string;
  caption: string;
  hashtags: string[];
  notes: string;
  category: string | null;
};

function validateMetadata(input: {
  title: unknown;
  caption: unknown;
  hashtags: unknown;
  notes: unknown;
  category: unknown;
}): { data: Metadata } | { fieldErrors: Record<string, string> } {
  const title = String(input.title ?? "").trim();
  const caption = String(input.caption ?? "").replace(/\r\n?/g, "\n").trim();
  const notes = String(input.notes ?? "").replace(/\r\n?/g, "\n").trim();
  const category = String(input.category ?? "").trim();
  const hashtags = parseHashtags(String(input.hashtags ?? ""));

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = "Title is required.";
  else if (title.length > 200) fieldErrors.title = "Title must be 200 characters or fewer.";
  if (caption.length > 5000) fieldErrors.caption = "Caption must be 5,000 characters or fewer.";
  if (notes.length > 5000) fieldErrors.notes = "Notes must be 5,000 characters or fewer.";
  if (category.length > 60) fieldErrors.category = "Category must be 60 characters or fewer.";

  if (Object.keys(fieldErrors).length) return { fieldErrors };
  return { data: { title, caption, hashtags, notes, category: category || null } };
}

function refresh(id?: string) {
  revalidatePath("/videos");
  revalidatePath("/history");
  if (id) revalidatePath(`/videos/${id}`);
}

export type CreateVideoInput = {
  id: string;
  title: string;
  caption: string;
  hashtags: string;
  notes: string;
  category: string;
  storagePath: string;
  thumbnailPath: string | null;
  originalFilename: string;
  fileSize: number;
};

/** Called by the uploader after the MP4 has been stored in Supabase Storage. */
export async function createVideo(input: CreateVideoInput): Promise<ActionResult & { id?: string }> {
  const { supabase, user } = await requireUser();

  if (!UUID_RE.test(input.id)) return { ok: false, error: "Invalid video id." };
  if (input.storagePath !== `${user.id}/${input.id}.mp4`) {
    return { ok: false, error: "Invalid storage path." };
  }
  if (input.thumbnailPath !== null && input.thumbnailPath !== `${user.id}/${input.id}.jpg`) {
    return { ok: false, error: "Invalid thumbnail path." };
  }
  const fileSize = Number(input.fileSize);
  if (!Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Invalid file size." };
  }
  const originalFilename = String(input.originalFilename ?? "").trim().slice(0, 255) || `${input.id}.mp4`;

  const parsed = validateMetadata(input);
  if ("fieldErrors" in parsed) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors };

  const { data: exists, error: existsError } = await supabase.storage
    .from(VIDEO_BUCKET)
    .exists(input.storagePath);
  if (existsError || !exists) {
    return { ok: false, error: "The uploaded file could not be found in storage. Please upload again." };
  }

  const { error } = await supabase.from("videos").insert({
    id: input.id,
    ...parsed.data,
    storage_path: input.storagePath,
    thumbnail_path: input.thumbnailPath,
    original_filename: originalFilename,
    file_size: fileSize,
  });
  if (error) return { ok: false, error: `Could not save video: ${error.message}` };

  refresh(input.id);
  return { ok: true, id: input.id };
}

export type FormState = { error?: string; fieldErrors?: Record<string, string>; saved?: boolean };

export async function updateVideo(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  if (!UUID_RE.test(id)) return { error: "Invalid video id." };

  const parsed = validateMetadata({
    title: formData.get("title"),
    caption: formData.get("caption"),
    hashtags: formData.get("hashtags"),
    notes: formData.get("notes"),
    category: formData.get("category"),
  });
  if ("fieldErrors" in parsed) return { error: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors };

  const { data, error } = await supabase.from("videos").update(parsed.data).eq("id", id).select("id");
  if (error) return { error: `Could not save changes: ${error.message}` };
  if (!data.length) return { error: "Video not found." };

  refresh(id);
  redirect(`/videos/${id}`);
}

export async function setPublication(id: string, platform: Platform, posted: boolean): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (!UUID_RE.test(id)) return { ok: false, error: "Invalid video id." };
  if (platform !== "instagram" && platform !== "tiktok") return { ok: false, error: "Unknown platform." };

  const value = posted ? new Date().toISOString() : null;
  const patch = platform === "instagram" ? { instagram_posted_at: value } : { tiktok_posted_at: value };

  const { data, error } = await supabase.from("videos").update(patch).eq("id", id).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data.length) return { ok: false, error: "Video not found." };

  refresh(id);
  return { ok: true };
}

export async function deleteVideo(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (!UUID_RE.test(id)) return { ok: false, error: "Invalid video id." };

  const { data: video, error } = await supabase
    .from("videos")
    .select("id, storage_path, thumbnail_path, file_deleted_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!video) return { ok: false, error: "Video not found." };

  if (!video.file_deleted_at) {
    const paths = [video.storage_path, video.thumbnail_path].filter((p): p is string => Boolean(p));
    const { error: removeError } = await supabase.storage.from(VIDEO_BUCKET).remove(paths);
    if (removeError) return { ok: false, error: `Could not delete the stored file: ${removeError.message}` };
  }

  const { error: deleteError } = await supabase.from("videos").delete().eq("id", id);
  if (deleteError) return { ok: false, error: deleteError.message };

  refresh();
  redirect("/videos");
}

export async function updateCompletionRule(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const rule = String(formData.get("completion_rule") ?? "") as CompletionRule;
  if (!COMPLETION_RULES.some((r) => r.value === rule)) return { error: "Choose a valid option." };

  const { data, error } = await supabase
    .from("user_settings")
    .update({ completion_rule: rule })
    .eq("user_id", user.id)
    .select("user_id");
  if (error) return { error: error.message };
  if (!data.length) {
    const { error: insertError } = await supabase.from("user_settings").insert({ completion_rule: rule });
    if (insertError) return { error: insertError.message };
  }

  refresh();
  revalidatePath("/settings");
  return { saved: true };
}
