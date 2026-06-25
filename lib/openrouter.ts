import "server-only";
import {
  PRIMARY_MODEL,
  FALLBACK_MODEL,
  GENERATION_RESOLUTION,
  GENERATION_ASPECT_RATIO,
  buildGenerationPrompt,
  buildBackgroundPrompt,
} from "@/lib/constants";
import type { BackgroundType } from "@/types";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export interface GeneratedImage {
  /** raw base64 payload (no `data:` prefix) */
  base64: string;
  mimeType: string;
  /** model slug that actually produced the image */
  model: string;
  costUsd: number | null;
}

export class OpenRouterError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "OpenRouterError";
    this.status = status;
  }
}

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new OpenRouterError("OPENROUTER_API_KEY is not configured on the server");
  return key;
}

function appHeaders(): Record<string, string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  // Both headers are recommended by OpenRouter for attribution / rankings.
  return {
    "HTTP-Referer": appUrl,
    "X-Title": "Sari AI Fashion Generator",
  };
}

interface CallImageApiParams {
  model: string;
  prompt: string;
  inputImageUrls?: string[];
  resolution?: string;
  aspectRatio?: string;
}

/**
 * Low-level call to OpenRouter's unified Image API.
 * Endpoint: POST /api/v1/images — returns base64 in `data[].b64_json`.
 */
async function callImageApi(params: CallImageApiParams): Promise<GeneratedImage> {
  const { model, prompt, inputImageUrls = [], resolution, aspectRatio } = params;

  const body: Record<string, unknown> = { model, prompt, output_format: "png" };
  if (resolution) body.resolution = resolution;
  if (aspectRatio) body.aspect_ratio = aspectRatio;
  if (inputImageUrls.length > 0) {
    body.input_references = inputImageUrls.map((url) => ({
      type: "image_url",
      image_url: { url },
    }));
  }

  let res: Response;
  try {
    res = await fetch(`${OPENROUTER_BASE_URL}/images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
        ...appHeaders(),
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new OpenRouterError(
      `Network error contacting OpenRouter: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OpenRouterError(
      `OpenRouter image request failed (${res.status}): ${text.slice(0, 600)}`,
      res.status,
    );
  }

  const json = (await res.json()) as {
    data?: Array<{ b64_json?: string; image_base64?: string; mime_type?: string }>;
    usage?: { cost?: number };
  };

  const first = json?.data?.[0];
  const base64 = first?.b64_json ?? first?.image_base64;
  if (!base64) {
    throw new OpenRouterError("OpenRouter response did not contain image data");
  }

  return {
    base64,
    mimeType: first?.mime_type || "image/png",
    model,
    costUsd: typeof json?.usage?.cost === "number" ? json.usage!.cost! : null,
  };
}

/** Try the primary model; on failure, retry once with the cheaper fallback. */
async function withFallback(
  run: (model: string) => Promise<GeneratedImage>,
): Promise<GeneratedImage> {
  try {
    return await run(PRIMARY_MODEL);
  } catch (primaryErr) {
    try {
      return await run(FALLBACK_MODEL);
    } catch {
      // Surface the original (primary) error — it's usually the informative one.
      throw primaryErr;
    }
  }
}

/** Generate an AI fashion model wearing the uploaded sari. */
export async function generateFashionModel(
  sariImageUrl: string,
  customPrompt?: string,
): Promise<GeneratedImage & { prompt: string }> {
  const prompt = customPrompt?.trim() || buildGenerationPrompt();
  const image = await withFallback((model) =>
    callImageApi({
      model,
      prompt,
      inputImageUrls: [sariImageUrl],
      resolution: GENERATION_RESOLUTION,
      aspectRatio: GENERATION_ASPECT_RATIO,
    }),
  );
  return { ...image, prompt };
}

/** Replace the background of a generated model image, preserving the subject. */
export async function changeBackground(
  modelImageUrl: string,
  backgroundType: BackgroundType,
  backgroundValue: string,
): Promise<GeneratedImage & { prompt: string; scene: string }> {
  const { prompt, scene } = buildBackgroundPrompt(backgroundType, backgroundValue);
  const image = await withFallback((model) =>
    callImageApi({
      model,
      prompt,
      inputImageUrls: [modelImageUrl],
      resolution: GENERATION_RESOLUTION,
      aspectRatio: GENERATION_ASPECT_RATIO,
    }),
  );
  return { ...image, prompt, scene };
}
