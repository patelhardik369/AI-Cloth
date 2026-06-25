"use client";

import * as React from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  RESOLUTION_PRESETS,
  MIN_EXPORT_DIMENSION,
  MAX_EXPORT_DIMENSION,
} from "@/lib/constants";
import { cn, clamp } from "@/lib/utils";

export interface ResolutionValue {
  width: number;
  height: number;
}

interface ResolutionSelectorProps {
  value: ResolutionValue;
  onChange: (value: ResolutionValue) => void;
  disabled?: boolean;
}

/** Preset resolution cards plus a custom width/height mode (clamped on blur). */
export function ResolutionSelector({ value, onChange, disabled }: ResolutionSelectorProps) {
  const matchedPreset = RESOLUTION_PRESETS.find(
    (p) => p.width === value.width && p.height === value.height,
  );
  const [custom, setCustom] = React.useState(!matchedPreset);
  const [widthStr, setWidthStr] = React.useState(String(value.width));
  const [heightStr, setHeightStr] = React.useState(String(value.height));
  const [clampNote, setClampNote] = React.useState<string | null>(null);

  // Keep the text inputs in sync when the value changes from a preset click.
  React.useEffect(() => {
    setWidthStr(String(value.width));
    setHeightStr(String(value.height));
  }, [value.width, value.height]);

  function selectPreset(width: number, height: number) {
    setCustom(false);
    setClampNote(null);
    onChange({ width, height });
  }

  function commit(dimension: "width" | "height", raw: string) {
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      // revert to last good value
      setWidthStr(String(value.width));
      setHeightStr(String(value.height));
      return;
    }
    const next = clamp(parsed, MIN_EXPORT_DIMENSION, MAX_EXPORT_DIMENSION);
    setClampNote(
      next !== parsed
        ? `Clamped to ${MIN_EXPORT_DIMENSION}–${MAX_EXPORT_DIMENSION} px.`
        : null,
    );
    onChange(
      dimension === "width"
        ? { width: next, height: value.height }
        : { width: value.width, height: next },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {RESOLUTION_PRESETS.map((preset) => {
          const selected = !custom && matchedPreset?.id === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => selectPreset(preset.width, preset.height)}
              className={cn(
                "relative flex flex-col gap-1 rounded-xl border bg-surface p-3.5 text-left transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed disabled:opacity-50",
                selected
                  ? "border-accent ring-2 ring-accent shadow-lift"
                  : "border-border hover:border-border-strong hover:shadow-soft",
              )}
            >
              {selected && (
                <span className="absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Check className="size-3.5" aria-hidden />
                </span>
              )}
              <span className="text-sm font-semibold text-foreground">{preset.label}</span>
              <span className="font-mono text-xs text-accent-strong">
                {preset.width}×{preset.height}
              </span>
              <span className="text-xs text-muted">{preset.description}</span>
            </button>
          );
        })}

        {/* Custom toggle card */}
        <button
          type="button"
          role="radio"
          aria-checked={custom}
          disabled={disabled}
          onClick={() => setCustom(true)}
          className={cn(
            "relative flex flex-col justify-center gap-1.5 rounded-xl border bg-surface p-3.5 text-left transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            custom
              ? "border-accent ring-2 ring-accent shadow-lift"
              : "border-border hover:border-border-strong hover:shadow-soft",
          )}
        >
          <SlidersHorizontal className="size-4 text-accent-strong" aria-hidden />
          <span className="text-sm font-semibold text-foreground">Custom</span>
          <span className="text-xs text-muted">Set your own size</span>
        </button>
      </div>

      {custom && (
        <div className="animate-fade-in flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="res-width">Width (px)</Label>
              <Input
                id="res-width"
                type="number"
                inputMode="numeric"
                min={MIN_EXPORT_DIMENSION}
                max={MAX_EXPORT_DIMENSION}
                value={widthStr}
                disabled={disabled}
                onChange={(e) => setWidthStr(e.target.value)}
                onBlur={(e) => commit("width", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="res-height">Height (px)</Label>
              <Input
                id="res-height"
                type="number"
                inputMode="numeric"
                min={MIN_EXPORT_DIMENSION}
                max={MAX_EXPORT_DIMENSION}
                value={heightStr}
                disabled={disabled}
                onChange={(e) => setHeightStr(e.target.value)}
                onBlur={(e) => commit("height", e.target.value)}
              />
            </div>
          </div>
          <p className={cn("text-xs", clampNote ? "text-accent-strong" : "text-muted")}>
            {clampNote ?? `${MIN_EXPORT_DIMENSION}–${MAX_EXPORT_DIMENSION} px per side.`}
          </p>
        </div>
      )}
    </div>
  );
}
