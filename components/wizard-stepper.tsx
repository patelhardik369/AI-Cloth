"use client";

import * as React from "react";
import { Check, UploadCloud, Sparkles, Image as ImageIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "Upload", icon: UploadCloud },
  { n: 2, label: "Generate", icon: Sparkles },
  { n: 3, label: "Background", icon: ImageIcon },
  { n: 4, label: "Export", icon: Download },
] as const;

/** Horizontal 4-step progress indicator for the generation wizard. */
export function WizardStepper({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  return (
    <nav aria-label="Generation progress" className="mx-auto max-w-2xl">
      <ol className="flex items-start">
        {STEPS.map((step, i) => {
          const status =
            step.n < currentStep ? "complete" : step.n === currentStep ? "current" : "upcoming";
          const Icon = step.icon;
          const isLast = i === STEPS.length - 1;

          return (
            <React.Fragment key={step.n}>
              <li
                className="flex shrink-0 flex-col items-center gap-2"
                aria-current={status === "current" ? "step" : undefined}
              >
                <span
                  className={cn(
                    "relative inline-flex size-10 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-300",
                    status === "complete" &&
                      "border-accent bg-accent text-accent-foreground shadow-soft",
                    status === "current" &&
                      "border-accent bg-surface text-accent-strong ring-2 ring-ring ring-offset-2 ring-offset-background",
                    status === "upcoming" && "border-border bg-surface-2 text-muted",
                  )}
                >
                  {status === "complete" ? (
                    <Check className="size-5" aria-hidden />
                  ) : (
                    <Icon className="size-[18px]" aria-hidden />
                  )}
                </span>
                <span
                  className={cn(
                    "hidden text-xs font-medium tracking-wide sm:block",
                    status === "upcoming" ? "text-muted" : "text-foreground",
                  )}
                >
                  {step.label}
                </span>
                <span className="sr-only">
                  {step.label}
                  {status === "complete" ? " (completed)" : status === "current" ? " (current step)" : ""}
                </span>
              </li>

              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "mx-2 mt-5 h-px flex-1 rounded-full transition-colors duration-300 sm:mx-3",
                    step.n < currentStep ? "hairline" : "bg-border",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
