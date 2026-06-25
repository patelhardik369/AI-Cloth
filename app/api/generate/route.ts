import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAuthenticatedUser,
  countTodayUsage,
  nextMidnight,
} from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadGeneratedImage } from "@/lib/supabase/storage";
import { generateFashionModel } from "@/lib/openrouter";
import { DAILY_GENERATION_LIMIT } from "@/lib/constants";
import type {
  ApiError,
  GenerateRequest,
  GenerateResponse,
  Generation,
  Profile,
} from "@/types";

// sharp + Buffer + the service-role admin client all require the Node runtime.
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
  if (!generationId || !sariImageUrl) {
    return NextResponse.json<ApiError>(
      { error: "generationId and sariImageUrl are required" },
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

  // 4. Enforce the daily generation limit.
  const used = await countTodayUsage(user.id);
  if (used >= DAILY_GENERATION_LIMIT) {
    // `resetsAt` is a useful extra field layered on top of the ApiError shape.
    return NextResponse.json(
      { error: "Daily limit reached", code: "rate_limited", resetsAt: nextMidnight() },
      { status: 429 },
    );
  }

  // 5. Mark the row as in-flight (best-effort; the model call proceeds regardless).
  await db
    .from("generations")
    .update({ status: "generating" } satisfies Partial<Generation>)
    .eq("id", generationId);

  // 6. Generate -> upload -> persist.
  try {
    const img = await generateFashionModel(sariImageUrl);

    const generatedImageUrl = await uploadGeneratedImage(
      admin,
      img.base64,
      user.id,
      { mimeType: img.mimeType, prefix: "model" },
    );

    const { data: saved, error: updateError } = await db
      .from("generations")
      .update({
        generated_image_url: generatedImageUrl,
        final_image_url: generatedImageUrl,
        model_used: img.model,
        prompt_used: img.prompt,
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

    // 7. Increment the lifetime usage counter (best-effort — never fails the request).
    try {
      const { data: profileRow, error: profileError } = await db
        .from("profiles")
        .select("generation_count")
        .eq("id", user.id)
        .single();
      const profile = (profileRow ?? null) as Pick<Profile, "generation_count"> | null;
      if (!profileError && profile) {
        await db
          .from("profiles")
          .update({
            generation_count: (profile.generation_count ?? 0) + 1,
          } satisfies Partial<Profile>)
          .eq("id", user.id);
      }
    } catch (usageErr) {
      console.error("[api/generate] usage increment failed:", usageErr);
    }

    return NextResponse.json<GenerateResponse>(
      { generatedImageUrl, generation: updated },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/generate] generation failed:", err);
    // Best-effort: mark the row failed with the technical detail (server-side only).
    try {
      await db
        .from("generations")
        .update({ status: "failed", error_message: message } satisfies Partial<Generation>)
        .eq("id", generationId);
    } catch (markErr) {
      console.error("[api/generate] failed to mark row failed:", markErr);
    }
    return NextResponse.json<ApiError>(
      { error: "Image generation failed. Please try again." },
      { status: 502 },
    );
  }
}
