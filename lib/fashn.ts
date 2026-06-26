import "server-only";
import {
  FASHN_MODEL_NAME,
  FASHN_MODEL_USED,
  FASHN_RESOLUTION,
  FASHN_GENERATION_MODE,
  FASHN_ASPECT_RATIO,
  FASHN_POLL_INTERVAL_MS,
  FASHN_POLL_TIMEOUT_MS,
} from "@/lib/constants";

const FASHN_BASE_URL = "https://api.fashn.ai/v1";

export interface FashnResult {
  /** Hosted CDN URL of the finished image (output[0]). */
  outputUrl: string;
  /** Engine identifier stored in generations.model_used. */
  model: string;
  /** The prompt actually sent to FASHN. */
  prompt: string;
  /** The seed used (randomised per call so "Regenerate" varies). */
  seed: number;
}

export class FashnError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "FashnError";
    this.status = status;
  }
}

interface GenerateOptions {
  resolution?: string;
  generationMode?: string;
  aspectRatio?: string;
  seed?: number;
}

function getApiKey(): string {
  const key = process.env.FASHN_API_KEY;
  if (!key) throw new FashnError("FASHN_API_KEY is not configured on the server");
  return key;
}

/** Non-cryptographic 32-bit seed so repeated runs of the same inputs differ. */
function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface RunResponse {
  id?: string;
  error?: string | null;
}

interface StatusResponse {
  id?: string;
  status?: "starting" | "in_queue" | "processing" | "completed" | "failed";
  output?: string[] | null;
  error?: string | { name?: string; message?: string } | null;
}

function errorText(error: StatusResponse["error"]): string {
  if (!error) return "FASHN generation failed";
  if (typeof error === "string") return error;
  return error.message || error.name || "FASHN generation failed";
}

/** Kick off a prediction. Returns the prediction id to poll. */
async function startRun(inputs: Record<string, unknown>): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${FASHN_BASE_URL}/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model_name: FASHN_MODEL_NAME, inputs }),
    });
  } catch (err) {
    throw new FashnError(
      `Network error contacting FASHN: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new FashnError(`FASHN run request failed (${res.status}): ${text.slice(0, 600)}`, res.status);
  }

  const json = (await res.json()) as RunResponse;
  if (json.error) throw new FashnError(errorText(json.error));
  if (!json.id) throw new FashnError("FASHN run response did not include a prediction id");
  return json.id;
}

/** Poll the prediction until it completes, fails, or times out. */
async function pollUntilDone(id: string): Promise<string> {
  const deadline = Date.now() + FASHN_POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await sleep(FASHN_POLL_INTERVAL_MS);

    let res: Response;
    try {
      res = await fetch(`${FASHN_BASE_URL}/status/${id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${getApiKey()}` },
      });
    } catch (err) {
      throw new FashnError(
        `Network error polling FASHN: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new FashnError(
        `FASHN status request failed (${res.status}): ${text.slice(0, 600)}`,
        res.status,
      );
    }

    const json = (await res.json()) as StatusResponse;
    if (json.status === "completed") {
      const url = json.output?.[0];
      if (!url) throw new FashnError("FASHN completed but returned no image");
      return url;
    }
    if (json.status === "failed") {
      throw new FashnError(errorText(json.error));
    }
    // starting | in_queue | processing -> keep polling
  }

  throw new FashnError("FASHN generation timed out. Please try again.");
}

/**
 * Generate a fashion model wearing the uploaded garment, in a single call.
 * The free-text `prompt` carries all instructions (model, pose, scene, props);
 * the garment itself is preserved from `productImageUrl`.
 */
export async function generateFashionModel(
  productImageUrl: string,
  prompt: string,
  opts: GenerateOptions = {},
): Promise<FashnResult> {
  const seed = opts.seed ?? randomSeed();
  const inputs: Record<string, unknown> = {
    product_image: productImageUrl,
    prompt,
    aspect_ratio: opts.aspectRatio ?? FASHN_ASPECT_RATIO,
    resolution: opts.resolution ?? FASHN_RESOLUTION,
    generation_mode: opts.generationMode ?? FASHN_GENERATION_MODE,
    output_format: "png",
    return_base64: false,
    num_images: 1,
    seed,
  };

  const id = await startRun(inputs);
  const outputUrl = await pollUntilDone(id);
  return { outputUrl, model: FASHN_MODEL_USED, prompt, seed };
}
