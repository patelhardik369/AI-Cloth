"use client";

import * as React from "react";
import { Check, Palette, Type, PaintBucket } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PRESET_BACKGROUNDS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BackgroundType } from "@/types";

export interface BackgroundSelection {
  type: BackgroundType;
  /** preset id, custom description, or hex color string */
  value: string;
}

const TABS: { id: BackgroundType; label: string; icon: React.ElementType }[] = [
  { id: "preset", label: "Presets", icon: Palette },
  { id: "custom", label: "Describe", icon: Type },
  { id: "solid", label: "Solid color", icon: PaintBucket },
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_SOLID = "#e7e0d4";

interface BackgroundPickerProps {
  value: BackgroundSelection;
  onChange: (value: BackgroundSelection) => void;
  disabled?: boolean;
}

/** Three-mode background chooser: gallery presets, free-text, or a solid colour. */
export function BackgroundPicker({ value, onChange, disabled }: BackgroundPickerProps) {
  // Keep each mode's draft independent so switching tabs never loses work.
  const [presetId, setPresetId] = React.useState(value.type === "preset" ? value.value : "");
  const [customText, setCustomText] = React.useState(value.type === "custom" ? value.value : "");
  const [solidHex, setSolidHex] = React.useState(
    value.type === "solid" && value.value ? value.value : DEFAULT_SOLID,
  );

  const tab = value.type;

  function switchTab(next: BackgroundType) {
    if (next === tab) return;
    if (next === "preset") onChange({ type: "preset", value: presetId });
    else if (next === "custom") onChange({ type: "custom", value: customText });
    else onChange({ type: "solid", value: solidHex });
  }

  function pickPreset(id: string) {
    setPresetId(id);
    onChange({ type: "preset", value: id });
  }

  function setCustom(text: string) {
    setCustomText(text);
    onChange({ type: "custom", value: text });
  }

  function setSolid(hex: string) {
    setSolidHex(hex);
    onChange({ type: "solid", value: hex });
  }

  const hexValid = HEX_RE.test(solidHex);

  return (
    <div className="flex flex-col gap-5">
      {/* Mode tabs */}
      <div role="tablist" aria-label="Background mode" className="flex flex-wrap gap-1.5 rounded-xl bg-surface-2 p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={active}
              disabled={disabled}
              onClick={() => switchTab(t.id)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "bg-surface text-foreground shadow-soft"
                  : "text-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Presets */}
      {tab === "preset" && (
        <div
          role="radiogroup"
          aria-label="Background preset"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {PRESET_BACKGROUNDS.map((preset) => {
            const selected = presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => pickPreset(preset.id)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  selected
                    ? "border-accent ring-2 ring-accent shadow-lift"
                    : "border-border hover:border-border-strong hover:shadow-soft",
                )}
              >
                <span
                  className="block h-20 w-full"
                  style={{ backgroundImage: preset.gradient }}
                  aria-hidden
                />
                {selected && (
                  <span className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-soft">
                    <Check className="size-4" aria-hidden />
                  </span>
                )}
                <span className="block border-t border-border bg-surface px-3 py-2">
                  <span className="block truncate text-sm font-medium text-foreground">{preset.name}</span>
                  <span className="block truncate text-xs text-muted">{preset.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Custom description */}
      {tab === "custom" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="bg-custom">Describe your background</Label>
          <Textarea
            id="bg-custom"
            value={customText}
            disabled={disabled}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. a sunlit terracotta courtyard with potted jasmine and soft morning haze…"
            className="min-h-28"
          />
          <p className="text-xs text-muted">
            Be specific about the scene, lighting and mood. The model and sari stay exactly as generated.
          </p>
        </div>
      )}

      {/* Solid colour */}
      {tab === "solid" && (
        <div className="flex flex-col gap-3">
          <Label htmlFor="bg-hex">Pick a solid colour</Label>
          <div className="flex items-center gap-3">
            <span className="relative inline-flex size-12 shrink-0 overflow-hidden rounded-lg border border-border-strong">
              <input
                type="color"
                value={hexValid ? solidHex : DEFAULT_SOLID}
                disabled={disabled}
                onChange={(e) => setSolid(e.target.value)}
                aria-label="Background colour picker"
                className="absolute -inset-1 size-[calc(100%+0.5rem)] cursor-pointer border-0 bg-transparent p-0"
              />
            </span>
            <Input
              id="bg-hex"
              value={solidHex}
              disabled={disabled}
              onChange={(e) => {
                let v = e.target.value.trim();
                if (v && !v.startsWith("#")) v = `#${v}`;
                setSolid(v);
              }}
              spellCheck={false}
              maxLength={7}
              placeholder="#e7e0d4"
              className="max-w-40 font-mono uppercase"
              aria-invalid={!hexValid}
            />
            <span
              className="inline-block h-12 flex-1 rounded-lg border border-border"
              style={{ backgroundColor: hexValid ? solidHex : "transparent" }}
              aria-hidden
            />
          </div>
          {!hexValid && (
            <p className="text-xs text-destructive">Enter a 6-digit hex colour, e.g. #c9a84c.</p>
          )}
        </div>
      )}
    </div>
  );
}
