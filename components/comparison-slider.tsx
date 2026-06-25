"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import { cn, clamp } from "@/lib/utils";

interface ComparisonSliderProps {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}

/**
 * Pure CSS/JS before/after slider. The `before` image is clipped via clip-path
 * and revealed by dragging the divider or using the focusable range input
 * (arrow keys). No external libraries.
 */
export function ComparisonSlider({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
}: ComparisonSliderProps) {
  const [pos, setPos] = React.useState(50);
  const [focused, setFocused] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const setFromClientX = React.useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    setPos(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100));
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
    inputRef.current?.focus();
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons === 0) return; // only while pressed / captured
    setFromClientX(e.clientX);
  }

  const rounded = Math.round(pos);

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Before and after comparison"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      className="relative mx-auto aspect-[3/4] w-full max-w-md touch-none select-none overflow-hidden rounded-md border border-border bg-surface-2 shadow-soft"
    >
      {/* After image = base layer (revealed on the right) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={after}
        alt={afterLabel}
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />

      {/* Before image = clipped overlay (revealed on the left) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={before}
        alt={beforeLabel}
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />

      {/* Corner labels */}
      <span className="pointer-events-none absolute left-3 top-3 rounded-sm bg-ink-900/75 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-bone-100 backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-sm bg-ink-900/75 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-bone-100 backdrop-blur-sm">
        {afterLabel}
      </span>

      {/* Divider + handle */}
      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-bone-50/90 ring-1 ring-ink-900/20"
        style={{ left: `${pos}%` }}
        aria-hidden
      >
        <span
          className={cn(
            "absolute top-1/2 left-1/2 inline-flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-lift transition-transform",
            focused && "ring-2 ring-ring ring-offset-2 ring-offset-background",
          )}
        >
          <GripVertical className="size-5 text-accent-strong" aria-hidden />
        </span>
      </div>

      {/* Keyboard-accessible control (sr-only but focusable; pointer handled above) */}
      <input
        ref={inputRef}
        type="range"
        min={0}
        max={100}
        step={1}
        value={rounded}
        onChange={(e) => setPos(Number(e.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="Reveal amount — drag or use arrow keys to compare before and after"
        aria-valuetext={`${rounded}% revealing ${afterLabel}`}
        className="sr-only"
      />
    </div>
  );
}
