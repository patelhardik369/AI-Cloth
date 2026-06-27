"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface GenerationProgressProps {
  steps: readonly string[];
  note?: string;
}

/**
 * Reassuring, indeterminate loading UI shown while the model renders. We don't
 * get a real progress signal from the engine, so there is deliberately NO
 * progress bar — just a pulsing placeholder card and rotating status text.
 * Motion is dampened globally under prefers-reduced-motion.
 */
export function GenerationProgress({ steps, note }: GenerationProgressProps) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (steps.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % steps.length);
    }, 3500);
    return () => window.clearInterval(id);
  }, [steps.length]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-7 py-2">
      {/* Pulsing placeholder card (3:4) with shimmer */}
      <div className="relative aspect-[3/4] w-full max-w-[18rem] overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-soft shimmer">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-surface/70 text-accent-strong">
            <Sparkles className="size-8 animate-pulse" aria-hidden />
          </span>
          <span className="kicker text-[0.6rem]">Rendering</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 text-center" aria-live="polite" aria-atomic="true">
        <p className="flex items-center gap-2 font-display text-lg text-foreground">
          <Spinner className="size-4" />
          <span key={index} className="animate-fade-in">
            {steps[index]}
          </span>
        </p>
        {note && <p className="text-sm text-muted">{note}</p>}
      </div>
    </div>
  );
}
