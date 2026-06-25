import type { BackgroundPreset, BackgroundType, ResolutionPreset } from "@/types";

/* ----------------------------- Models ----------------------------- */
// Verified OpenRouter slugs (Nov 2025+). Primary = Nano Banana Pro.
export const PRIMARY_MODEL = "google/gemini-3-pro-image-preview"; // Nano Banana Pro (Gemini 3 Pro Image)
export const FALLBACK_MODEL = "google/gemini-3.1-flash-image-preview"; // Nano Banana 2 (cheaper retries)

/* --------------------------- Limits ------------------------------- */
export const DAILY_GENERATION_LIMIT = 10;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;
export const MIN_EXPORT_DIMENSION = 256;
export const MAX_EXPORT_DIMENSION = 8192;

/* ----------------------- Render settings -------------------------- */
// We always render a high-res portrait master; `sharp` downscales to the
// user's chosen export size for crisp, advertisement-ready output.
export const GENERATION_RESOLUTION = "4K" as const;
export const GENERATION_ASPECT_RATIO = "3:4" as const; // portrait, full-body fashion

/* --------------------------- Storage ------------------------------ */
export const STORAGE_BUCKETS = {
  sari: "sari-uploads",
  generated: "generated-outputs",
} as const;

/* --------------------- Background presets -------------------------- */
// Each `prompt` is a rich, photographer-grade scene description injected
// into the background-replacement prompt. `gradient` is a cheap CSS preview.
export const PRESET_BACKGROUNDS: BackgroundPreset[] = [
  {
    id: "white-studio",
    name: "White Studio",
    description: "Clean seamless studio",
    prompt:
      "a clean, seamless pure-white photography studio backdrop with soft, even diffused lighting and a subtle floor shadow",
    gradient: "linear-gradient(135deg,#ffffff 0%,#f2f2f2 100%)",
  },
  {
    id: "outdoor-garden",
    name: "Outdoor Garden",
    description: "Lush greenery",
    prompt:
      "a lush outdoor garden with soft-focus green foliage, blooming flowers and dappled golden-hour sunlight filtering through leaves",
    gradient: "linear-gradient(135deg,#3f6f43 0%,#a7c957 100%)",
  },
  {
    id: "heritage-palace",
    name: "Heritage Palace",
    description: "Royal Indian mahal",
    prompt:
      "the ornate interior of a royal Indian heritage palace (mahal) with carved marble pillars, intricate frescoes, arched doorways and warm regal lighting",
    gradient: "linear-gradient(135deg,#7b341e 0%,#c9a84c 100%)",
  },
  {
    id: "city-skyline",
    name: "Modern City",
    description: "Skyline at dusk",
    prompt:
      "a modern city skyline at blue-hour dusk with softly blurred glass skyscrapers and bokeh city lights",
    gradient: "linear-gradient(135deg,#1e293b 0%,#475569 60%,#f59e0b 100%)",
  },
  {
    id: "pastel-bokeh",
    name: "Pastel Bokeh",
    description: "Dreamy abstract",
    prompt:
      "a dreamy abstract pastel background with soft out-of-focus bokeh in blush pink, lavender and cream tones",
    gradient: "linear-gradient(135deg,#fbcfe8 0%,#ddd6fe 50%,#fef9c3 100%)",
  },
  {
    id: "festive-rangoli",
    name: "Festive Rangoli",
    description: "Diwali floor art",
    prompt:
      "a festive Indian celebration setting with a vibrant colorful rangoli floor design, glowing diyas (oil lamps) and warm marigold decorations",
    gradient: "linear-gradient(135deg,#dc2626 0%,#f59e0b 50%,#fde047 100%)",
  },
  {
    id: "beach-sunset",
    name: "Beach Sunset",
    description: "Golden shoreline",
    prompt:
      "a serene beach at golden sunset with gentle ocean waves, warm amber and rose sky, and soft glowing rim light",
    gradient: "linear-gradient(135deg,#f97316 0%,#fbbf24 45%,#38bdf8 100%)",
  },
  {
    id: "mughal-archway",
    name: "Mughal Archway",
    description: "Carved sandstone arch",
    prompt:
      "an elegant Mughal architectural archway of carved red sandstone and white marble inlay, with symmetric jali screens and soft directional daylight",
    gradient: "linear-gradient(135deg,#9a3412 0%,#d6b044 100%)",
  },
];

/* ----------------------- Resolution presets ----------------------- */
export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { id: "square-1080", label: "Social Square", width: 1080, height: 1080, description: "Instagram / FB post" },
  { id: "portrait-1080", label: "Instagram Portrait", width: 1080, height: 1350, description: "4:5 feed portrait" },
  { id: "banner-1920", label: "Full HD Banner", width: 1920, height: 1080, description: "Website / ad banner" },
  { id: "print-4k", label: "4K Print", width: 3840, height: 2160, description: "High-res print" },
];

/* ----------------- Wizard progress copy (Step 2) ------------------ */
export const GENERATION_PROGRESS_STEPS = [
  "Reading the sari's weave & border…",
  "Styling the drape and pallu…",
  "Placing the model in the studio…",
  "Adding soft editorial lighting…",
  "Rendering ultra-detailed fabric…",
  "Finalizing your 4K image…",
] as const;

export const BACKGROUND_PROGRESS_STEPS = [
  "Isolating the model and sari…",
  "Composing the new scene…",
  "Matching light & color temperature…",
  "Blending edges seamlessly…",
  "Finalizing your image…",
] as const;

/* ----------------------- Prompt engineering ----------------------- */

/**
 * Master prompt for turning a sari reference into a styled fashion-model
 * photo. Garment fidelity is stated first and most emphatically because
 * identity/garment preservation is the hardest part for image models.
 */
export function buildGenerationPrompt(): string {
  return [
    "A professional Indian female fashion model wearing the exact traditional sari shown in the reference image.",
    "GARMENT FIDELITY (most important): reproduce the sari with complete accuracy — identical color, print, motifs, weave, embroidery, zari border and pallu pattern as the reference. Do not redesign, restyle, recolor or simplify the fabric; preserve its drape and texture faithfully.",
    "Drape the sari elegantly in a classic Nivi style with the pallu falling gracefully over the shoulder, revealing the full length and decorative border, paired with a matching fitted blouse.",
    "Pose: a poised, confident full-body shot — the model standing gracefully so the complete drape and pallu are visible from head to toe.",
    "Model: an elegant Indian woman with natural, realistic skin texture, tasteful minimal jewellery, neat hair styling and a warm confident expression.",
    "Setting: a clean, seamless light studio backdrop with soft, diffused three-point lighting and gentle natural shadows.",
    "Photography: high-end editorial fashion photography, shot on an 85mm lens at f/4, professional color grading and skin retouching, ultra-sharp focus so the fabric weave and embroidery read crisply.",
    "Output: advertisement-quality, photorealistic, ultra-detailed, native 4K resolution, vertical full-body composition.",
  ].join("\n");
}

/** Resolve the human/scene description for a chosen background. */
export function resolveBackgroundScene(type: BackgroundType, value: string): string {
  if (type === "preset") {
    const preset = PRESET_BACKGROUNDS.find((p) => p.id === value || p.name === value);
    return preset?.prompt ?? value;
  }
  if (type === "solid") {
    return `a seamless, evenly-lit solid ${value} colored studio backdrop with no texture or gradient`;
  }
  // custom
  return value;
}

/**
 * Background-replacement prompt. Subject preservation is stated emphatically
 * and edge-relighting is requested so the composite never looks cut-out.
 */
export function buildBackgroundPrompt(
  type: BackgroundType,
  value: string,
): { prompt: string; scene: string } {
  const scene = resolveBackgroundScene(type, value);
  const prompt = [
    `Replace ONLY the background of this image with: ${scene}.`,
    "Keep the model's face, body, pose, hair, skin tone, jewellery and the sari (its color, print, drape, border and fabric texture) exactly as they are — do not alter the subject in any way.",
    "Relight the subject's edges subtly to match the new scene's light direction and color temperature so the composite looks seamless and natural, with no halo, fringing or cut-out look.",
    "Photorealistic, advertisement quality, sharp focus, consistent perspective and depth of field.",
  ].join("\n");
  return { prompt, scene };
}
