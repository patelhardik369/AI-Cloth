"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Copy,
  ImageOff,
  CalendarDays,
  Frame,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { PRESET_BACKGROUNDS } from "@/lib/constants";
import { cn, downloadBlob, formatDate } from "@/lib/utils";
import type { ApiError, DownloadRequest, Generation, GenerationStatus } from "@/types";

const STATUS_META: Record<GenerationStatus, { label: string; variant: BadgeProps["variant"] }> = {
  pending: { label: "Pending", variant: "outline" },
  generating: { label: "Generating", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
};

const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1350;

function backgroundLabel(generation: Generation): string {
  if (!generation.background_type) return "Studio · no change";
  if (generation.background_type === "preset") {
    return (
      PRESET_BACKGROUNDS.find((p) => p.id === generation.background_value)?.name ?? "Preset scene"
    );
  }
  if (generation.background_type === "solid") {
    return `Solid ${(generation.background_value ?? "").toUpperCase()}`;
  }
  return generation.background_value || "Custom scene";
}

export function PastGenerationView({ generation }: { generation: Generation }) {
  const { toast } = useToast();
  const [downloading, setDownloading] = React.useState(false);

  const finalUrl =
    generation.final_image_url ??
    generation.background_image_url ??
    generation.generated_image_url;
  const width = generation.resolution_width ?? DEFAULT_WIDTH;
  const height = generation.resolution_height ?? DEFAULT_HEIGHT;
  const status = STATUS_META[generation.status];
  const isSolid = generation.background_type === "solid";

  async function handleDownload() {
    if (!finalUrl || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId: generation.id,
          imageUrl: finalUrl,
          width,
          height,
        } satisfies DownloadRequest),
      });
      if (!res.ok) {
        let message = "Download failed. Please try again.";
        try {
          const data = (await res.json()) as ApiError;
          if (data?.error) message = data.error;
        } catch {
          /* keep fallback */
        }
        throw new Error(message);
      }
      const blob = await res.blob();
      downloadBlob(blob, `sari-ai-${generation.id}.png`);
      toast({
        title: "Download started",
        description: `${width}×${height} PNG`,
        variant: "success",
      });
    } catch (e) {
      toast({
        title: "Download failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setDownloading(false);
    }
  }

  async function copyLink() {
    if (!finalUrl) return;
    try {
      await navigator.clipboard.writeText(finalUrl);
      toast({ title: "Link copied", description: "Image URL copied to clipboard.", variant: "success" });
    } catch {
      toast({
        title: "Couldn't copy",
        description: "Your browser blocked clipboard access.",
        variant: "error",
      });
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to dashboard
      </Link>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="kicker">Your shoot</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Generation details</h1>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_minmax(0,18rem)] lg:items-start">
        {/* Images */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Figure label="Original sari">
            <Image
              src={generation.sari_image_url}
              alt="Original uploaded sari"
              fill
              sizes="(max-width: 640px) 100vw, 40vw"
              className="object-contain"
            />
          </Figure>

          <Figure label="Final result" highlight={!!finalUrl}>
            {finalUrl ? (
              <Image
                src={finalUrl}
                alt="Final generated fashion shoot"
                fill
                sizes="(max-width: 640px) 100vw, 40vw"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-muted">
                <ImageOff className="size-8" aria-hidden />
                <p className="px-4 text-center text-sm">
                  {generation.error_message || "No image was produced for this shoot."}
                </p>
              </div>
            )}
          </Figure>
        </div>

        {/* Meta + actions */}
        <aside className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5 shadow-soft">
          <dl className="flex flex-col gap-4 text-sm">
            <MetaRow icon={CalendarDays} label="Created">
              {formatDate(generation.created_at)}
            </MetaRow>
            <MetaRow icon={Palette} label="Background">
              <span className="inline-flex items-center gap-2">
                {isSolid && /^#[0-9a-fA-F]{6}$/.test(generation.background_value ?? "") && (
                  <span
                    className="inline-block size-3.5 rounded-full border border-border"
                    style={{ backgroundColor: generation.background_value as string }}
                    aria-hidden
                  />
                )}
                {backgroundLabel(generation)}
              </span>
            </MetaRow>
            <MetaRow icon={Frame} label="Resolution">
              {generation.resolution_width && generation.resolution_height
                ? `${generation.resolution_width}×${generation.resolution_height}`
                : `${DEFAULT_WIDTH}×${DEFAULT_HEIGHT} (default)`}
            </MetaRow>
          </dl>

          <div className="flex flex-col gap-2.5 border-t border-border pt-5">
            <Button
              variant="primary"
              loading={downloading}
              disabled={!finalUrl}
              onClick={handleDownload}
            >
              {!downloading && <Download className="size-4" aria-hidden />}
              {downloading ? "Preparing…" : "Download"}
            </Button>
            <Button variant="outline" disabled={!finalUrl} onClick={copyLink}>
              <Copy className="size-4" aria-hidden />
              Copy link
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Figure({
  label,
  highlight,
  children,
}: {
  label: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm font-medium text-muted">{label}</figcaption>
      <div
        className={cn(
          "relative aspect-[3/4] w-full overflow-hidden rounded-xl border bg-surface-2",
          highlight ? "border-accent shadow-lift" : "border-border",
        )}
      >
        {children}
      </div>
    </figure>
  );
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="inline-flex items-center gap-2 text-muted">
        <Icon className="size-4" aria-hidden />
        {label}
      </dt>
      <dd className="text-right font-medium text-foreground">{children}</dd>
    </div>
  );
}
