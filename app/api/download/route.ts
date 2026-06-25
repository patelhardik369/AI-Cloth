import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { getAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { clamp } from "@/lib/utils";
import { MIN_EXPORT_DIMENSION, MAX_EXPORT_DIMENSION } from "@/lib/constants";
import type { ApiError, DownloadRequest, Generation } from "@/types";

// sharp resize + Buffer streaming require the Node runtime.
export const runtime = "nodejs";
// Fetching a 4K source image + resizing can take a few seconds; allow headroom.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // 1. Authenticate first — never do work for unauthenticated callers.
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate body.
  let body: Partial<DownloadRequest>;
  try {
    body = (await req.json()) as Partial<DownloadRequest>;
  } catch {
    return NextResponse.json<ApiError>({ error: "Invalid JSON body" }, { status: 400 });
  }

  const generationId =
    typeof body.generationId === "string" ? body.generationId.trim() : "";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  if (!generationId || !imageUrl) {
    return NextResponse.json<ApiError>(
      { error: "generationId and imageUrl are required" },
      { status: 400 },
    );
  }

  // Parse dimensions. Reject non-finite values; clamp valid ones into range (per PRD).
  const rawWidth = Number(body.width);
  const rawHeight = Number(body.height);
  if (!Number.isFinite(rawWidth) || !Number.isFinite(rawHeight)) {
    return NextResponse.json<ApiError>(
      { error: "width and height must be valid numbers" },
      { status: 400 },
    );
  }
  const width = clamp(Math.round(rawWidth), MIN_EXPORT_DIMENSION, MAX_EXPORT_DIMENSION);
  const height = clamp(Math.round(rawHeight), MIN_EXPORT_DIMENSION, MAX_EXPORT_DIMENSION);

  // Relaxed view for row reads/writes (see app/api/generate/route.ts for why).
  const db = createAdminClient() as unknown as SupabaseClient;

  // 3. Load the target row and verify ownership.
  const { data: loaded, error: loadError } = await db
    .from("generations")
    .select("*")
    .eq("id", generationId)
    .single();
  const row = (loaded ?? null) as Generation | null;
  if (loadError || !row) {
    return NextResponse.json<ApiError>({ error: "Generation not found" }, { status: 404 });
  }
  if (row.user_id !== user.id) {
    return NextResponse.json<ApiError>({ error: "Forbidden" }, { status: 403 });
  }

  // 4. Fetch the source image, resize, and stream it back as a PNG attachment.
  try {
    const resp = await fetch(imageUrl);
    if (!resp.ok) {
      console.error(`[api/download] source fetch failed (${resp.status}) for ${imageUrl}`);
      return NextResponse.json<ApiError>(
        { error: "Could not fetch the source image" },
        { status: 502 },
      );
    }
    const input = Buffer.from(await resp.arrayBuffer());

    const out = await sharp(input)
      .resize(width, height, { fit: "cover", position: "centre" })
      .png({ quality: 100 })
      .toBuffer();

    // Best-effort: record the chosen export resolution.
    try {
      await db
        .from("generations")
        .update({
          resolution_width: width,
          resolution_height: height,
        } satisfies Partial<Generation>)
        .eq("id", generationId);
    } catch (recordErr) {
      console.error("[api/download] failed to record resolution:", recordErr);
    }

    return new NextResponse(new Uint8Array(out), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="sari-ai-${generationId}.png"`,
        "Content-Length": String(out.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[api/download] export failed:", err);
    return NextResponse.json<ApiError>(
      { error: "Image export failed. Please try again." },
      { status: 502 },
    );
  }
}
