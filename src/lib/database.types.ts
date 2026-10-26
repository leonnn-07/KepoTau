// Mirrors supabase/migrations/20261026000100_kepotau_schema.sql.
// Regenerate with: npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VideoStatus = "ready" | "partially_posted" | "posted" | "archived";
export type CompletionRule = "both" | "either" | "instagram" | "tiktok";

export type VideoRow = {
  id: string;
  user_id: string;
  title: string;
  caption: string;
  hashtags: string[];
  notes: string;
  category: string | null;
  storage_path: string;
  thumbnail_path: string | null;
  original_filename: string;
  file_size: number;
  status: VideoStatus;
  instagram_posted_at: string | null;
  tiktok_posted_at: string | null;
  posted_at: string | null;
  delete_at: string | null;
  file_deleted_at: string | null;
  cleanup_attempts: number;
  cleanup_last_error: string | null;
  cleanup_locked_until: string | null;
  search_text: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      videos: {
        Row: VideoRow;
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          caption?: string;
          hashtags?: string[];
          notes?: string;
          category?: string | null;
          storage_path: string;
          thumbnail_path?: string | null;
          original_filename: string;
          file_size: number;
        };
        Update: {
          title?: string;
          caption?: string;
          hashtags?: string[];
          notes?: string;
          category?: string | null;
          instagram_posted_at?: string | null;
          tiktok_posted_at?: string | null;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          completion_rule: CompletionRule;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id?: string;
          completion_rule?: CompletionRule;
        };
        Update: {
          completion_rule?: CompletionRule;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      claim_videos_for_cleanup: {
        Args: { p_limit?: number; p_lock_minutes?: number };
        Returns: VideoRow[];
      };
      mark_video_file_deleted: {
        Args: { p_id: string };
        Returns: undefined;
      };
      record_video_cleanup_failure: {
        Args: { p_id: string; p_error: string };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
