import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadGeneratedImageFromUrl, removeByPublicUrl } from "@/lib/supabase/storage";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { generateFashionModel } from "@/lib/fashn";
import type {
  ApiError,
  GenerateRequest,
  GenerateResponse,
  Generation,
} from "@/types";

// Buffer + the service-role admin client require the Node runtime.
export const runtime = "nodejs";
// Image generation can take ~40s; give the function generous headroom.
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // 1. Authenticate first — never do work for unauthenticated callers.
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate body.
  let body: Partial<GenerateRequest>;
  try {
    body = (await req.json()) as Partial<GenerateRequest>;
  } catch {
    return NextResponse.json<ApiError>({ error: "Invalid JSON body" }, { status: 400 });
  }

  const generationId =
    typeof body.generationId === "string" ? body.generationId.trim() : "";
  const sariImageUrl =
    typeof body.sariImageUrl === "string" ? body.sariImageUrl.trim() : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!generationId || !sariImageUrl) {
    return NextResponse.json<ApiError>(
      { error: "generationId and sariImageUrl are required" },
      { status: 400 },
    );
  }
  if (!prompt) {
    return NextResponse.json<ApiError>(
      { error: "A prompt is required to generate the shoot" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  // The shared `Database` type omits postgrest's `Relationships` key, so the
  // typed client collapses table rows to `never`. Use a relaxed view for row
  // reads/writes (payloads stay checked via `satisfies`, results via casts) and
  // keep the typed `admin` for storage uploads. Remove once `types` is fixed.
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

  // 4. Mark the row as in-flight (best-effort; the model call proceeds regardless).
  await db
    .from("generations")
    .update({ status: "generating" } satisfies Partial<Generation>)
    .eq("id", generationId);

  // 5. Generate (single FASHN call) -> re-upload the CDN result -> persist.
  try {
    const result = await generateFashionModel(sariImageUrl, prompt);

    const generatedImageUrl = await uploadGeneratedImageFromUrl(
      admin,
      result.outputUrl,
      user.id,
      { prefix: "model" },
    );

    const { data: saved, error: updateError } = await db
      .from("generations")
      .update({
        generated_image_url: generatedImageUrl,
        // Single-pass: the generated model image is the final image.
        final_image_url: generatedImageUrl,
        model_used: result.model,
        prompt_used: result.prompt,
        status: "completed",
        error_message: null,
      } satisfies Partial<Generation>)
      .eq("id", generationId)
      .select()
      .single();
    const updated = (saved ?? null) as Generation | null;
    if (updateError || !updated) {
      throw new Error(updateError?.message || "Failed to persist the generated image");
    }

    return NextResponse.json<GenerateResponse>(
      { generatedImageUrl, generation: updated },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/generate] generation failed:", err);
    // Clean up so failed attempts never linger on the dashboard or in storage.
    try {
      if (row.generated_image_url) {
        // This row already had a successful image (a failed *re*generate) — keep
        // it. Restore the completed status; don't destroy the prior result.
        await db
          .from("generations")
          .update({ status: "completed", error_message: null } satisfies Partial<Generation>)
          .eq("id", generationId);
      } else {
        // First-time failure: delete the orphaned sari upload and the row so no
        // junk image or failed shoot is stored.
        await removeByPublicUrl(admin, STORAGE_BUCKETS.sari, sariImageUrl);
        await db.from("generations").delete().eq("id", generationId);
      }
    } catch (cleanupErr) {
      console.error("[api/generate] failure cleanup error:", cleanupErr);
    }
    return NextResponse.json<ApiError>(
      { error: "Image generation failed. Please try again." },
      { status: 502 },
    );
  }
}
