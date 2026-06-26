import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiError, DownloadRequest, Generation } from "@/types";

// Buffer streaming requires the Node runtime.
export const runtime = "nodejs";
// Fetching a 4K source image can take a few seconds; allow headroom.
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
  if (!generationId) {
    return NextResponse.json<ApiError>({ error: "generationId is required" }, { status: 400 });
  }

  // Relaxed view for row reads (see app/api/generate/route.ts for why).
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

  // 4. Use the stored image (our source of truth) — never a client-supplied URL,
  //    and never resized: stream the original, full-quality 4K master as-is.
  const sourceUrl = row.final_image_url || row.generated_image_url;
  if (!sourceUrl) {
    return NextResponse.json<ApiError>(
      { error: "This shoot has no finished image yet" },
      { status: 409 },
    );
  }

  try {
    const resp = await fetch(sourceUrl);
    if (!resp.ok) {
      console.error(`[api/download] source fetch failed (${resp.status}) for ${sourceUrl}`);
      return NextResponse.json<ApiError>(
        { error: "Could not fetch the source image" },
        { status: 502 },
      );
    }
    const contentType = (resp.headers.get("content-type") || "image/png").split(";")[0].trim();
    const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
    const out = Buffer.from(await resp.arrayBuffer());

    return new NextResponse(new Uint8Array(out), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="sari-ai-${generationId}.${ext}"`,
        "Content-Length": String(out.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[api/download] export failed:", err);
    return NextResponse.json<ApiError>(
      { error: "Image download failed. Please try again." },
      { status: 502 },
    );
  }
}
