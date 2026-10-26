import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { CompletionRule, VideoRow, VideoStatus } from "@/lib/database.types";
import { VIDEO_BUCKET } from "@/lib/env";
import { UUID_RE } from "@/lib/videos";

export const PAGE_SIZE = 24;
const SIGNED_URL_TTL = 60 * 60; // 1 hour

export type VideoFilters = {
  q?: string;
  category?: string;
  status?: VideoStatus | "active" | "all";
  page?: number;
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listVideos(filters: VideoFilters) {
  const { supabase } = await requireUser();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("videos")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const q = filters.q?.trim().toLowerCase();
  if (q) query = query.ilike("search_text", `%${escapeLike(q)}%`);
  if (filters.category) query = query.eq("category", filters.category);

  const status = filters.status ?? "active";
  if (status === "active") query = query.neq("status", "archived");
  else if (status !== "all") query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) throw new Error(`Could not load videos: ${error.message}`);
  return { videos: data, total: count ?? 0, page, pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)) };
}

export async function getVideoStats() {
  const { supabase } = await requireUser();
  const count = async (status: VideoStatus) => {
    const { count, error } = await supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("status", status);
    if (error) throw new Error(`Could not load stats: ${error.message}`);
    return count ?? 0;
  };
  const [ready, partial, posted, archived] = await Promise.all([
    count("ready"),
    count("partially_posted"),
    count("posted"),
    count("archived"),
  ]);
  return { ready, partial, posted, archived };
}

export async function getCategories() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("videos")
    .select("category")
    .not("category", "is", null)
    .order("category")
    .limit(1000);
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return [...new Set(data.map((r) => r.category as string))];
}

export async function getVideo(id: string) {
  if (!UUID_RE.test(id)) notFound();
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("videos").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load video: ${error.message}`);
  if (!data) notFound();
  return data;
}

export async function listPublished(page = 1) {
  const { supabase } = await requireUser();
  const from = (Math.max(1, page) - 1) * PAGE_SIZE;
  const { data, error, count } = await supabase
    .from("videos")
    .select("*", { count: "exact" })
    .or("instagram_posted_at.not.is.null,tiktok_posted_at.not.is.null")
    .order("posted_at", { ascending: false, nullsFirst: true })
    .order("updated_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`Could not load history: ${error.message}`);
  return { videos: data, total: count ?? 0, pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)) };
}

export async function getCompletionRule(): Promise<CompletionRule> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("user_settings").select("completion_rule").maybeSingle();
  if (error) throw new Error(`Could not load settings: ${error.message}`);
  return data?.completion_rule ?? "both";
}

/** Signed thumbnail URLs for videos whose files still exist, keyed by video id. */
export async function getThumbnailUrls(videos: Pick<VideoRow, "id" | "thumbnail_path" | "file_deleted_at">[]) {
  const withThumbs = videos.filter((v) => v.thumbnail_path && !v.file_deleted_at);
  const map = new Map<string, string>();
  if (withThumbs.length === 0) return map;
  const { supabase } = await requireUser();
  const { data } = await supabase.storage
    .from(VIDEO_BUCKET)
    .createSignedUrls(withThumbs.map((v) => v.thumbnail_path as string), SIGNED_URL_TTL);
  data?.forEach((item, i) => {
    if (item.signedUrl) map.set(withThumbs[i].id, item.signedUrl);
  });
  return map;
}

export async function getPreviewUrls(video: VideoRow) {
  if (video.file_deleted_at) return { videoUrl: null, posterUrl: null };
  const { supabase } = await requireUser();
  const bucket = supabase.storage.from(VIDEO_BUCKET);
  const [videoRes, posterRes] = await Promise.all([
    bucket.createSignedUrl(video.storage_path, SIGNED_URL_TTL),
    video.thumbnail_path ? bucket.createSignedUrl(video.thumbnail_path, SIGNED_URL_TTL) : null,
  ]);
  return {
    videoUrl: videoRes.data?.signedUrl ?? null,
    videoError: videoRes.error?.message,
    posterUrl: posterRes?.data?.signedUrl ?? null,
  };
}
