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
import { ResolutionSelector, type ResolutionValue } from "@/components/resolution-selector";
import {
  GENERATION_PROGRESS_STEPS,
  PRESET_BACKGROUNDS,
  DEFAULT_GENERATION_PROMPT,
} from "@/lib/constants";
import { cn, downloadBlob } from "@/lib/utils";
import type {
  ApiError,
  GenerateRequest,
  GenerateResponse,
  DownloadRequest,
} from "@/types";

type Step = 1 | 2 | 3;

const DEFAULT_RESOLUTION: ResolutionValue = { width: 1080, height: 1350 };

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
  const [prompt, setPrompt] = React.useState<string>(DEFAULT_GENERATION_PROMPT);
  const [sariImageUrl, setSariImageUrl] = React.useState<string | null>(null);
  const [generationId, setGenerationId] = React.useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = React.useState<string | null>(null);
  const [resolution, setResolution] = React.useState<ResolutionValue>(DEFAULT_RESOLUTION);

  // Status flags
  const [uploading, setUploading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
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
      toast({ title: "Sari uploaded", description: "Starting your AI shoot…", variant: "success" });
      setStep(2);
      void runGenerate(row.id, url, prompt.trim());
    } catch (e) {
      toast({ title: "Upload failed", description: errorMessage(e), variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  function regenerate() {
    if (!generationId || !sariImageUrl || !prompt.trim()) return;
    setGeneratedImageUrl(null);
    void runGenerate(generationId, sariImageUrl, prompt.trim());
  }

  /** Append a preset scene description to the editable prompt. */
  function addScene(sceneText: string) {
    setPrompt((prev) => {
      const base = prev.trimEnd();
      return base ? `${base}\n${sceneText}` : sceneText;
    });
  }

  async function handleDownload() {
    if (!generationId || !generatedImageUrl || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId,
          imageUrl: generatedImageUrl,
          width: resolution.width,
          height: resolution.height,
        } satisfies DownloadRequest),
      });

      if (!res.ok) {
        throw new Error(await readApiError(res, "Download failed. Please try again."));
      }

      const blob = await res.blob();
      downloadBlob(blob, `sari-ai-${generationId}.png`);
      toast({
        title: "Download started",
        description: `${resolution.width}×${resolution.height} PNG`,
        variant: "success",
      });
    } catch (e) {
      toast({ title: "Download failed", description: errorMessage(e), variant: "error" });
    } finally {
      setDownloading(false);
    }
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
    setPrompt(DEFAULT_GENERATION_PROMPT);
    setSariImageUrl(null);
    setGenerationId(null);
    setGeneratedImageUrl(null);
    setResolution(DEFAULT_RESOLUTION);
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
          Upload a sari, describe the model, pose and scene, and export advertisement-ready in 4K —
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
                title="Upload & describe your shoot"
                description="Add a clear photo of the full garment, then describe the model, pose, scene and any props. The exact sari is preserved automatically."
              />

              <ImageUploadZone onFileSelected={setFile} disabled={uploading} />

              <div className="flex flex-col gap-2">
                <Label htmlFor="shoot-prompt">Describe your shoot</Label>
                <Textarea
                  id="shoot-prompt"
                  value={prompt}
                  disabled={uploading}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the model, drape, pose, background scene and any props…"
                  className="min-h-44"
                />
                <p className="text-xs text-muted">
                  Tweak anything — the model&apos;s look, the pose, the lighting, the backdrop. Your
                  uploaded sari is worn exactly as-is.
                </p>

                <div className="mt-1 flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted">Quick scenes — tap to add</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_BACKGROUNDS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={uploading}
                        onClick={() => addScene(preset.prompt)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition-colors",
                          "hover:border-accent hover:text-accent-strong",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                      >
                        <span
                          className="size-3 rounded-full border border-border"
                          style={{ backgroundImage: preset.gradient }}
                          aria-hidden
                        />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!file || !prompt.trim()}
                  loading={uploading}
                  onClick={startUploadAndGenerate}
                  className="sm:min-w-52"
                >
                  {!uploading && <Wand2 className="size-4" aria-hidden />}
                  {uploading ? "Uploading…" : "Generate shoot"}
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
                description="Our AI is dressing a studio model in your exact sari with editorial lighting."
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
                      label="Your sari"
                      src={sariImageUrl}
                      alt="Uploaded sari"
                      fit="contain"
                    />
                    <ResultFrame
                      label="Generated shoot"
                      src={generatedImageUrl}
                      alt="AI-generated model wearing the sari"
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
                title="Download your shoot"
                description="Pick a resolution and export a crisp PNG, ready for ads, catalogues or social."
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
                    <Badge variant="accent">4K master</Badge>
                    <Badge variant="outline">
                      {resolution.width}×{resolution.height}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <ResolutionSelector value={resolution} onChange={setResolution} disabled={downloading} />

                  <div className="flex flex-col gap-2.5 border-t border-border pt-5">
                    <div className="flex flex-col gap-2.5 sm:flex-row">
                      <Button
                        variant="primary"
                        size="lg"
                        loading={downloading}
                        onClick={handleDownload}
                        className="flex-1"
                      >
                        {!downloading && <Download className="size-4" aria-hidden />}
                        {downloading ? "Preparing…" : "Download image"}
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
