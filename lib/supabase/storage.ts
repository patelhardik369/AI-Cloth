import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { shortId } from "@/lib/utils";

type DB = SupabaseClient<Database>;

/** Resolve a public CDN URL for an object. */
export function publicUrl(supabase: DB, bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Upload a user-selected sari File (browser, anon client) and return its
 * public URL. Path: sari-uploads/{userId}/{uuid}.{ext}
 */
export async function uploadSariImage(
  supabase: DB,
  file: File,
  userId: string,
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${shortId()}.${ext}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.sari)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return publicUrl(supabase, STORAGE_BUCKETS.sari, path);
}

/**
 * Upload a base64 image (from the OpenRouter response, server-side admin
 * client) and return its public URL.
 * Path: generated-outputs/{userId}/{prefix}-{uuid}.{ext}
 */
export async function uploadGeneratedImage(
  supabase: DB,
  base64: string,
  userId: string,
  opts: { mimeType?: string; prefix?: string } = {},
): Promise<string> {
  const mimeType = opts.mimeType || "image/png";
  const ext = mimeType.split("/")[1] || "png";
  const prefix = opts.prefix || "model";
  const path = `${userId}/${prefix}-${shortId()}.${ext}`;
  const buffer = Buffer.from(base64, "base64");
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.generated)
    .upload(path, buffer, { contentType: mimeType, upsert: false });
  if (error) throw error;
  return publicUrl(supabase, STORAGE_BUCKETS.generated, path);
}
