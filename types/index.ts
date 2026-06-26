/* ------------------------------------------------------------------ */
/*  Shared type contract — the single source of truth for the app.    */
/*  API routes, components, and lib helpers all import from here.      */
/* ------------------------------------------------------------------ */

export type GenerationStatus = "pending" | "generating" | "completed" | "failed";
export type BackgroundType = "preset" | "custom" | "solid";

/** Row shape of the `profiles` table. */
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  generation_count: number;
  created_at: string;
  updated_at: string;
}

/** Row shape of the `generations` table. */
export interface Generation {
  id: string;
  user_id: string;
  sari_image_url: string;
  generated_image_url: string | null;
  background_image_url: string | null;
  final_image_url: string | null;
  background_type: BackgroundType | null;
  background_value: string | null;
  resolution_width: number | null;
  resolution_height: number | null;
  prompt_used: string | null;
  model_used: string;
  status: GenerationStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

/* ----------------------------- API I/O ---------------------------- */

/** POST /api/generate — single-pass: prompt carries pose/scene/props. */
export interface GenerateRequest {
  generationId: string;
  sariImageUrl: string;
  prompt: string;
}
export interface GenerateResponse {
  generatedImageUrl: string;
  generation: Generation;
}

/** POST /api/download — streams the stored full-quality image (no JSON body). */
export interface DownloadRequest {
  generationId: string;
}

/** Uniform error envelope returned by every API route on failure. */
export interface ApiError {
  error: string;
  code?: string;
}

/* --------------------------- UI config ---------------------------- */

export interface BackgroundPreset {
  id: string;
  name: string;
  /** short UI caption */
  description: string;
  /** rich scene description injected into the model prompt */
  prompt: string;
  /** CSS gradient used as a lightweight preview swatch */
  gradient: string;
}

export interface ResolutionPreset {
  id: string;
  label: string;
  width: number;
  height: number;
  description: string;
}

/* ---------------------- Supabase typed schema --------------------- */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      generations: {
        Row: Generation;
        Insert: Partial<Generation> & { user_id: string; sari_image_url: string };
        Update: Partial<Generation>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
