import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VIDEO_BUCKET } from "@/lib/env";
import { UUID_RE } from "@/lib/videos";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** Redirects to a short-lived signed URL that downloads the file with its original name. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/videos/[id]/download">) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: NO_STORE });

  // RLS limits this to the signed-in user's own videos.
  const { data: video, error } = await supabase
    .from("videos")
    .select("storage_path, original_filename, file_deleted_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
  if (video.file_deleted_at) {
    return NextResponse.json({ error: "This file was deleted after publication." }, { status: 410, headers: NO_STORE });
  }

  const { data, error: signError } = await supabase.storage
    .from(VIDEO_BUCKET)
    .createSignedUrl(video.storage_path, 300, { download: video.original_filename });
  if (signError || !data) {
    return NextResponse.json({ error: signError?.message ?? "Could not sign URL" }, { status: 502, headers: NO_STORE });
  }

  return NextResponse.redirect(data.signedUrl, { status: 303, headers: NO_STORE });
}
