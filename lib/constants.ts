import type { BackgroundPreset, ResolutionPreset } from "@/types";

/* --------------------------- FASHN engine ------------------------- */
// We use FASHN's own Product-to-Model API (api.fashn.ai). It warps the
// actual garment pixels onto a generated model — preserving the exact sari —
// and renders native 4K in a single call that also handles pose/scene.
export const FASHN_MODEL_NAME = "product-to-model";
export const FASHN_MODEL_USED = "fashn/product-to-model"; // stored in generations.model_used
export const FASHN_RESOLUTION = "4k" as const; // "1k" | "2k" | "4k" (4k ≈ 16 MP)
export const FASHN_GENERATION_MODE = "fast" as const; // "fast" | "balanced" | "quality"
export const FASHN_ASPECT_RATIO = "3:4" as const; // portrait, full-body fashion
export const FASHN_POLL_INTERVAL_MS = 2000;
export const FASHN_POLL_TIMEOUT_MS = 110_000; // stay under the route's maxDuration=120

/* ----------------------------- Upload ----------------------------- */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;
export const MIN_EXPORT_DIMENSION = 256;
export const MAX_EXPORT_DIMENSION = 8192;

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

/* ----------------------- Prompt engineering ----------------------- */

/**
 * Always-applied garment-fidelity instruction. This is prepended to EVERY
 * generation (the user cannot edit it away), so the model always wears the
 * EXACT uploaded garment — the core promise of the product. Garment-agnostic:
 * it works for a sari, kurta, sherwani, shirt, lehenga, suit, gown, etc.
 */
export const GARMENT_FIDELITY_INSTRUCTION =
  "The model is wearing the exact garment from the uploaded image, fitted naturally on the body. Reproduce the garment exactly as-is — identical fabric, colour, print, pattern, embroidery, texture, cut and every detail. Do not restyle, recolour, redesign, crop or swap the garment.";

/** Model choices offered in the wizard (drives the subject of the prompt). */
export const MODEL_OPTIONS = [
  { id: "female", label: "Female model", prompt: "a professional female fashion model" },
  { id: "male", label: "Male model", prompt: "a professional male fashion model" },
] as const;

export type ModelOptionId = (typeof MODEL_OPTIONS)[number]["id"];

/**
 * Default *extra details* that seed the editable prompt box. Kept garment- and
 * gender-neutral so it works for any outfit — the garment-fidelity line, the
 * chosen model and the chosen scene are added around it at generation time.
 * (No backdrop line here on purpose: the scene comes from the wizard's
 * single-select picker, appended once as a "Setting:" line.)
 */
export const DEFAULT_GENERATION_PROMPT = [
  "Full-body editorial pose, standing naturally so the entire outfit is visible from head to toe.",
  "Realistic skin texture, tasteful styling, neat hair and a warm, confident expression.",
  "High-end fashion photography, soft diffused studio lighting, professional colour grading, ultra-sharp focus and fine fabric detail. Advertisement-quality, photorealistic, ultra-detailed and poster-ready.",
].join("\n");
