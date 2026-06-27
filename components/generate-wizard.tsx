"use client";

import * as React from "react";
import Image from "next/image";
import {
  Wand2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  RefreshCw,
  Download,
  Copy,
  AlertTriangle,
  Image as ImageIcon,
  Sparkles,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadSariImage } from "@/lib/supabase/storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { WizardStepper } from "@/components/wizard-stepper";
import { ImageUploadZone } from "@/components/image-upload-zone";
import { GenerationProgress } from "@/components/generation-progress";
import {
  GENERATION_PROGRESS_STEPS,
  PRESET_BACKGROUNDS,
  DEFAULT_GENERATION_PROMPT,
  GARMENT_FIDELITY_INSTRUCTION,
  MODEL_OPTIONS,
} from "@/lib/constants";
import { cn, downloadFromUrl } from "@/lib/utils";
import type { ApiError, GenerateRequest, GenerateResponse } from "@/types";

type Step = 1 | 2 | 3;

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Something went wrong. Please try again.";
}

async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as ApiError;
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

export function GenerateWizard({ userId }: { userId: string }) {
  const { toast } = useToast();

  const [step, setStep] = React.useState<Step>(1);

  // Inputs / artifacts
  const [file, setFile] = React.useState<File | null>(null);
  // Model subject (always set) — drives a male/female fashion model.
  const [modelId, setModelId] = React.useState<string>("female");
  // Optional extra styling details (the editable prompt box).
  const [prompt, setPrompt] = React.useState<string>(DEFAULT_GENERATION_PROMPT);
  // Single-select scene (preset id) kept separate from the free-text prompt so
  // it can never stack — it's merged into one "Setting:" line at submit time.
  const [sceneId, setSceneId] = React.useState<string | null>("white-studio");
  const [sariImageUrl, setSariImageUrl] = React.useState<string | null>(null);
  const [generationId, setGenerationId] = React.useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = React.useState<string | null>(null);

  // Status flags
  const [uploading, setUploading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [genError, setGenError] = React.useState<string | null>(null);

  /* ----------------------------- Actions ----------------------------- */

  const runGenerate = React.useCallback(
    async (genId: string, sariUrl: string, promptText: string) => {
      setGenerating(true);
      setGenError(null);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generationId: genId,
            sariImageUrl: sariUrl,
            prompt: promptText,
          } satisfies GenerateRequest),
        });

        if (!res.ok) {
          throw new Error(await readApiError(res, "Generation failed. Please try again."));
        }

        const data = (await res.json()) as GenerateResponse;
        setGeneratedImageUrl(data.generatedImageUrl);
        toast({
          title: "Your shoot is ready",
          description: "Review the result and continue when you're happy.",
          variant: "success",
        });
      } catch (e) {
        setGenError(errorMessage(e));
        toast({ title: "Generation failed", description: errorMessage(e), variant: "error" });
      } finally {
        setGenerating(false);
      }
    },
    [toast],
  );

  async function startUploadAndGenerate() {
    if (!file || uploading || !prompt.trim()) return;
    setUploading(true);
    setGenError(null);
    try {
      const supabase = createClient();
      const url = await uploadSariImage(supabase, file, userId);
      setSariImageUrl(url);

      // NOTE: the shared `Database` type omits postgrest-js's required
      // `Relationships` field, so the typed client resolves this table to
      // `never`. We assert the payload/row shape here; the runtime call is
      // exactly the contracted insert. See final report for the root fix.
      const { data, error } = await supabase
        .from("generations")
        .insert({ user_id: userId, sari_image_url: url, status: "pending" } as never)
        .select("id")
        .single();

      const row = data as { id: string } | null;
      if (error || !row) {
        throw new Error(error?.message || "Could not start a new generation.");
      }

      setGenerationId(row.id);
      toast({ title: "Garment uploaded", description: "Starting your AI shoot…", variant: "success" });
      setStep(2);
      void runGenerate(row.id, url, composedPrompt());
    } catch (e) {
      toast({ title: "Upload failed", description: errorMessage(e), variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  function regenerate() {
    if (!generationId || !sariImageUrl) return;
    setGeneratedImageUrl(null);
    void runGenerate(generationId, sariImageUrl, composedPrompt());
  }

  /**
   * Build the final prompt sent to the engine. Order is deliberate and the
   * garment-fidelity line is ALWAYS first and never user-editable, so the exact
   * uploaded garment is preserved no matter what the user types or clears.
   */
  function composedPrompt(): string {
    const model = MODEL_OPTIONS.find((m) => m.id === modelId) ?? MODEL_OPTIONS[0];
    const scene = sceneId ? PRESET_BACKGROUNDS.find((p) => p.id === sceneId) : null;
    const parts = [
      `Photorealistic full-body fashion photograph of ${model.prompt} wearing the uploaded garment.`,
      GARMENT_FIDELITY_INSTRUCTION,
    ];
    const details = prompt.trim();
    if (details) parts.push(details);
    if (scene) parts.push(`Setting: ${scene.prompt}.`);
    return parts.join("\n");
  }

  function handleDownload() {
    if (!generatedImageUrl) return;
    // Direct CDN download — no server round-trip, starts instantly.
    downloadFromUrl(generatedImageUrl, `sari-ai-${generationId}.png`);
    toast({
      title: "Download started",
      description: "Full-quality 4K image — ready to print.",
      variant: "success",
    });
  }

  async function copyLink() {
    if (!generatedImageUrl) return;
    try {
      await navigator.clipboard.writeText(generatedImageUrl);
      toast({ title: "Link copied", description: "Image URL copied to clipboard.", variant: "success" });
    } catch {
      toast({
        title: "Couldn't copy",
        description: "Your browser blocked clipboard access.",
        variant: "error",
      });
    }
  }

  function resetWizard() {
    setStep(1);
    setFile(null);
    setModelId("female");
    setPrompt(DEFAULT_GENERATION_PROMPT);
    setSceneId("white-studio");
    setSariImageUrl(null);
    setGenerationId(null);
    setGeneratedImageUrl(null);
    setGenError(null);
  }

  /* ----------------------------- Render ------------------------------ */

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <header className="mb-8 text-center">
        <p className="kicker">New shoot</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Create your fashion shoot
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-balance text-muted">
          Upload any garment, choose a model and a backdrop, and export a poster-ready 4K image —
          all in a single generation.
        </p>
      </header>

      <WizardStepper currentStep={step} />

      <Card className="mx-auto mt-8 max-w-5xl animate-fade-up overflow-hidden">
        <div className="p-6 sm:p-8">
          {step === 1 && (
            <section className="flex flex-col gap-6">
              <StepHeading
                icon={ImageIcon}
                kicker="Step 1 · Create"
                title="Upload your garment"
                description="Add a clear, well-lit photo of the full outfit — any garment works. Pick a model and a backdrop; your garment is always worn exactly as you uploaded it."
              />

              <ImageUploadZone onFileSelected={setFile} disabled={uploading} />

              {/* Model */}
              <div className="flex flex-col gap-2">
                <Label>Choose your model</Label>
                <div role="radiogroup" aria-label="Model" className="grid grid-cols-2 gap-2 sm:max-w-sm">
                  {MODEL_OPTIONS.map((m) => {
                    const selected = modelId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={uploading}
                        onClick={() => setModelId(m.id)}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                          selected
                            ? "border-accent bg-accent/10 text-accent-strong"
                            : "border-border bg-surface-2 text-foreground hover:border-accent",
                        )}
                      >
                        <User className="size-4" aria-hidden />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Backdrop */}
              <div className="flex flex-col gap-2">
                <Label>Choose a backdrop</Label>
                <div role="radiogroup" aria-label="Backdrop" className="flex flex-wrap gap-1.5">
                  {PRESET_BACKGROUNDS.map((preset) => {
                    const selected = sceneId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={uploading}
                        onClick={() =>
                          setSceneId((prev) => (prev === preset.id ? null : preset.id))
                        }
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                          selected
                            ? "border-accent bg-accent/10 text-accent-strong"
                            : "border-border bg-surface-2 text-foreground hover:border-accent hover:text-accent-strong",
                        )}
                      >
                        <span
                          className="size-3 rounded-full border border-border"
                          style={{ backgroundImage: preset.gradient }}
                          aria-hidden
                        />
                        {preset.name}
                      </button>
                    );
                  })}
                </div>
                {sceneId ? (
                  <p className="text-xs text-muted">
                    Backdrop:{" "}
                    <span className="text-foreground">
                      {PRESET_BACKGROUNDS.find((p) => p.id === sceneId)?.description}
                    </span>{" "}
                    — tap again to clear and describe your own below.
                  </p>
                ) : (
                  <p className="text-xs text-muted">
                    No preset backdrop — describe the scene you want in the details below.
                  </p>
                )}
              </div>

              {/* Details (optional) */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="shoot-prompt">
                  Add details <span className="font-normal text-muted">(optional)</span>
                </Label>
                <Textarea
                  id="shoot-prompt"
                  value={prompt}
                  disabled={uploading}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. confident standing pose, soft daylight, gold jewellery, looking at the camera…"
                  className="min-h-36"
                />
                <p className="text-xs text-muted">
                  Optional — fine-tune the pose, mood, lighting or styling. You don&apos;t need to
                  mention the garment; it&apos;s always worn exactly as you uploaded it.
                </p>
              </div>

              <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!file}
                  loading={uploading}
                  onClick={startUploadAndGenerate}
                  className="sm:min-w-52"
                >
                  {!uploading && <Wand2 className="size-4" aria-hidden />}
                  {uploading ? "Uploading…" : "Generate poster"}
                </Button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="flex flex-col gap-6">
              <StepHeading
                icon={Sparkles}
                kicker="Step 2 · Result"
                title="Your generated shoot"
                description="Our AI is dressing the model in your exact garment with editorial lighting."
              />

              {generating && (
                <GenerationProgress
                  steps={GENERATION_PROGRESS_STEPS}
                  note="This usually takes 20–60 seconds…"
                />
              )}

              {!generating && genError && (
                <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                  <span className="inline-flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                    <AlertTriangle className="size-7" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold">That render didn&apos;t go through</h3>
                    <p className="mt-1.5 text-sm text-muted">{genError}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="primary" onClick={regenerate}>
                      <RefreshCw className="size-4" aria-hidden />
                      Try again
                    </Button>
                    <Button variant="ghost" onClick={resetWizard}>
                      Start over
                    </Button>
                  </div>
                </div>
              )}

              {!generating && !genError && generatedImageUrl && (
                <div className="flex flex-col gap-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ResultFrame
                      label="Your garment"
                      src={sariImageUrl}
                      alt="Uploaded garment"
                      fit="contain"
                    />
                    <ResultFrame
                      label="Generated shoot"
                      src={generatedImageUrl}
                      alt="AI-generated model wearing the uploaded garment"
                      fit="cover"
                      highlight
                    />
                  </div>
                  <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button variant="ghost" onClick={() => setStep(1)}>
                      <ArrowLeft className="size-4" aria-hidden />
                      Edit prompt
                    </Button>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button variant="outline" onClick={regenerate}>
                        <RotateCcw className="size-4" aria-hidden />
                        Regenerate
                      </Button>
                      <Button variant="primary" size="lg" onClick={() => setStep(3)}>
                        Continue to export
                        <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {step === 3 && (
            <section className="flex flex-col gap-6">
              <StepHeading
                icon={Download}
                kicker="Step 3 · Export"
                title="Download your poster"
                description="Your full-quality 4K master — exactly as generated, ready to print large or share."
              />

              <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr] lg:items-start">
                <div className="flex flex-col gap-3">
                  <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-soft">
                    {generatedImageUrl && (
                      <Image
                        src={generatedImageUrl}
                        alt="Final fashion shoot"
                        fill
                        sizes="(max-width: 1024px) 80vw, 320px"
                        className="object-contain"
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Badge variant="accent">Full-quality 4K</Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="rounded-xl border border-border bg-surface-2 p-5">
                    <h3 className="font-display text-lg font-semibold tracking-tight">
                      Poster-ready, no compression
                    </h3>
                    <p className="mt-1.5 text-sm text-muted">
                      We export the original 4K image straight from your library — no resizing or
                      cropping — so it stays razor-sharp when printed large.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5 border-t border-border pt-5">
                    <div className="flex flex-col gap-2.5 sm:flex-row">
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleDownload}
                        className="flex-1"
                      >
                        <Download className="size-4" aria-hidden />
                        Download 4K image
                      </Button>
                      <Button variant="outline" size="lg" onClick={copyLink} className="sm:flex-none">
                        <Copy className="size-4" aria-hidden />
                        Copy link
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Button variant="ghost" onClick={() => setStep(2)}>
                        <ArrowLeft className="size-4" aria-hidden />
                        Back
                      </Button>
                      <Button variant="ghost" onClick={resetWizard}>
                        <RotateCcw className="size-4" aria-hidden />
                        Start another shoot
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </Card>
    </div>
  );
}

/* --------------------------- Local helpers --------------------------- */

function StepHeading({
  icon: Icon,
  kicker,
  title,
  description,
}: {
  icon: React.ElementType;
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent-strong sm:inline-flex">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <p className="kicker">{kicker}</p>
        <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>
    </div>
  );
}

function ResultFrame({
  label,
  src,
  alt,
  fit,
  highlight,
}: {
  label: string;
  src: string | null;
  alt: string;
  fit: "cover" | "contain";
  highlight?: boolean;
}) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="flex items-center gap-2 text-sm font-medium text-muted">
        {highlight && <Sparkles className="size-4 text-accent-strong" aria-hidden />}
        {label}
      </figcaption>
      <div
        className={cn(
          "relative aspect-[3/4] w-full overflow-hidden rounded-xl border bg-surface-2",
          highlight ? "border-accent shadow-lift" : "border-border",
        )}
      >
        {src && (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className={fit === "cover" ? "object-cover" : "object-contain"}
          />
        )}
      </div>
    </figure>
  );
}
