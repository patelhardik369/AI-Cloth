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
 * Delete a storage object given its public URL (best-effort). Used to clean up
 * orphaned uploads from failed generations so they don't eat storage. The path
 * is everything after `/object/public/{bucket}/`.
 */
export async function removeByPublicUrl(
  supabase: DB,
  bucket: string,
  url: string,
): Promise<void> {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
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
 * Download a generated image from a (FASHN CDN) URL and re-upload it to our
 * Storage as the permanent source of truth. Returns its public URL.
 * Path: generated-outputs/{userId}/{prefix}-{uuid}.png
 */
export async function uploadGeneratedImageFromUrl(
  supabase: DB,
  sourceUrl: string,
  userId: string,
  opts: { prefix?: string } = {},
): Promise<string> {
  const resp = await fetch(sourceUrl);
  if (!resp.ok) {
    throw new Error(`Could not fetch the generated image (${resp.status})`);
  }
  const contentType = resp.headers.get("content-type") || "image/png";
  const mimeType = contentType.split(";")[0].trim() || "image/png";
  const ext = mimeType.split("/")[1] || "png";
  const prefix = opts.prefix || "model";
  const path = `${userId}/${prefix}-${shortId()}.${ext}`;
  const buffer = Buffer.from(await resp.arrayBuffer());
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.generated)
    .upload(path, buffer, { contentType: mimeType, upsert: false });
  if (error) throw error;
  return publicUrl(supabase, STORAGE_BUCKETS.generated, path);
}
