import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { VIDEO_BUCKET } from "@/lib/env";

export type CleanupResult = {
  claimed: number;
  deleted: number;
  failed: number;
  skipped: number;
  errors: { id: string; error: string }[];
};

const BATCH_SIZE = 20;
const TIME_BUDGET_MS = 45_000;

/**
 * Deletes stored files whose delete_at has passed.
 *
 * Safety:
 *  - Rows are claimed atomically by claim_videos_for_cleanup (FOR UPDATE SKIP
 *    LOCKED + a lease), so overlapping runs never process the same video.
 *  - Only videos with status "posted" and delete_at <= now() are claimed;
 *    unposted videos are never touched. Each row is re-checked here as well.
 *  - Removing a file that is already gone is treated as success, so a run
 *    that died after deleting but before marking simply finishes the job.
 *  - Failures are recorded and retried later with exponential backoff.
 *  - Only the file is removed; the row with caption, hashtags and history stays.
 */
export async function runCleanup(): Promise<CleanupResult> {
  const admin = createAdminClient();
  const result: CleanupResult = { claimed: 0, deleted: 0, failed: 0, skipped: 0, errors: [] };
  const started = Date.now();

  while (Date.now() - started < TIME_BUDGET_MS) {
    const { data: batch, error } = await admin.rpc("claim_videos_for_cleanup", {
      p_limit: BATCH_SIZE,
      p_lock_minutes: 10,
    });
    if (error) throw new Error(`Could not claim videos for cleanup: ${error.message}`);
    if (!batch || batch.length === 0) break;
    result.claimed += batch.length;

    for (const video of batch) {
      const due =
        video.status === "posted" &&
        video.posted_at !== null &&
        video.delete_at !== null &&
        new Date(video.delete_at).getTime() <= Date.now() &&
        video.file_deleted_at === null;
      if (!due) {
        result.skipped += 1;
        continue;
      }

      const paths = [video.storage_path, video.thumbnail_path].filter(
        (p): p is string => Boolean(p),
      );

      try {
        const { error: removeError } = await admin.storage.from(VIDEO_BUCKET).remove(paths);
        if (removeError) throw new Error(`Storage: ${removeError.message}`);

        const { error: markError } = await admin.rpc("mark_video_file_deleted", { p_id: video.id });
        if (markError) throw new Error(`Database: ${markError.message}`);

        result.deleted += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        result.failed += 1;
        result.errors.push({ id: video.id, error: message });
        const { error: recordError } = await admin.rpc("record_video_cleanup_failure", {
          p_id: video.id,
          p_error: message,
        });
        if (recordError) {
          // The lease still expires on its own, so the row is retried anyway.
          console.error("[cleanup] could not record failure", video.id, recordError.message);
        }
      }
    }

    if (batch.length < BATCH_SIZE) break;
  }

  return result;
}
