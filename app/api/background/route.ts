import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadGeneratedImage } from "@/lib/supabase/storage";
import { changeBackground } from "@/lib/openrouter";
import type {
  ApiError,
  BackgroundRequest,
  BackgroundResponse,
  Generation,
} from "@/types";

// The admin client + Buffer uploads require the Node runtime.
export const runtime = "nodejs";
// Background replacement is a full model call (~40s); allow headroom.
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // 1. Authenticate first — never do work for unauthenticated callers.
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate body.
  let body: Partial<BackgroundRequest>;
  try {
    body = (await req.json()) as Partial<BackgroundRequest>;
  } catch {
    return NextResponse.json<ApiError>({ error: "Invalid JSON body" }, { status: 400 });
  }

  const generationId =
    typeof body.generationId === "string" ? body.generationId.trim() : "";
  const modelImageUrl =
    typeof body.modelImageUrl === "string" ? body.modelImageUrl.trim() : "";
  const backgroundValue =
    typeof body.backgroundValue === "string" ? body.backgroundValue.trim() : "";
  const backgroundType = body.backgroundType;

  if (
    !generationId ||
    !modelImageUrl ||
    !backgroundValue ||
    (backgroundType !== "preset" &&
      backgroundType !== "custom" &&
      backgroundType !== "solid")
  ) {
    return NextResponse.json<ApiError>(
      {
        error:
          "generationId, modelImageUrl, backgroundValue and a valid backgroundType (preset | custom | solid) are required",
      },
      { status: 400 },
    );
  }
  // `backgroundType` is now narrowed to BackgroundType.

  const admin = createAdminClient();
  // Relaxed view for row reads/writes (see app/api/generate/route.ts for why);
  // the typed `admin` is used for the storage upload.
  const db = admin as unknown as SupabaseClient;

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

  // 4. Replace the background -> upload -> persist. (No usage increment for edits.)
  try {
    const img = await changeBackground(modelImageUrl, backgroundType, backgroundValue);

    const backgroundImageUrl = await uploadGeneratedImage(
      admin,
      img.base64,
      user.id,
      { mimeType: img.mimeType, prefix: "bg" },
    );

    const { data: saved, error: updateError } = await db
      .from("generations")
      .update({
        background_image_url: backgroundImageUrl,
        final_image_url: backgroundImageUrl,
        background_type: backgroundType,
        background_value: backgroundValue,
        model_used: img.model,
      } satisfies Partial<Generation>)
      .eq("id", generationId)
      .select()
      .single();
    const updated = (saved ?? null) as Generation | null;
    if (updateError || !updated) {
      throw new Error(updateError?.message || "Failed to persist the background");
    }

    return NextResponse.json<BackgroundResponse>(
      { backgroundImageUrl, generation: updated },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/background] background replacement failed:", err);
    // Best-effort: mark the row failed with the technical detail (server-side only).
    try {
      await db
        .from("generations")
        .update({ status: "failed", error_message: message } satisfies Partial<Generation>)
        .eq("id", generationId);
    } catch (markErr) {
      console.error("[api/background] failed to mark row failed:", markErr);
    }
    return NextResponse.json<ApiError>(
      { error: "Background replacement failed. Please try again." },
      { status: 502 },
    );
  }
}
