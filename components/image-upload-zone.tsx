"use client";

import * as React from "react";
import { UploadCloud, RefreshCw, Trash2, AlertCircle, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { cn, formatBytes } from "@/lib/utils";

interface ImageUploadZoneProps {
  onFileSelected: (file: File | null) => void;
  /** Disable interaction (e.g. while uploading). */
  disabled?: boolean;
}

/** Drag-and-drop / click image picker with inline validation and preview. */
export function ImageUploadZone({ onFileSelected, disabled }: ImageUploadZoneProps) {
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [meta, setMeta] = React.useState<{ name: string; size: number } | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Revoke the object URL whenever it changes or the component unmounts.
  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function validate(file: File): string | null {
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      return "Unsupported format. Please use a JPG, PNG or WEBP image.";
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return `That image is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`;
    }
    return null;
  }

  function handleFile(file: File | undefined | null) {
    if (!file) return;
    const err = validate(file);
    if (err) {
      setError(err);
      toast({ title: "Couldn't add that image", description: err, variant: "error" });
      return;
    }
    setError(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setMeta({ name: file.name, size: file.size });
    onFileSelected(file);
  }

  function clear() {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMeta(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onFileSelected(null);
  }

  const acceptAttr = ACCEPTED_IMAGE_TYPES.join(",");

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0])}
        aria-label="Upload a garment photo"
      />

      {preview ? (
        <div className="animate-scale-in overflow-hidden rounded-xl border border-border bg-surface-2">
          <div className="relative mx-auto flex max-h-[28rem] items-center justify-center">
            {/* Local object-URL preview — plain img is correct here (not a remote src). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={meta?.name ? `Preview of ${meta.name}` : "Selected garment preview"}
              className="max-h-[28rem] w-auto object-contain"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <ImageIcon className="size-4 shrink-0 text-accent-strong" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{meta?.name}</p>
                {meta && <p className="text-xs text-muted">{formatBytes(meta.size)}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
              >
                <RefreshCw className="size-4" aria-hidden />
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={clear}
                aria-label="Remove selected image"
              >
                <Trash2 className="size-4" aria-hidden />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!disabled) handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "group flex min-h-64 w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border-strong bg-surface px-6 py-12 text-center transition-colors",
            "hover:border-accent hover:bg-surface-2",
            "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-60",
            dragOver && "border-accent bg-surface-2",
          )}
        >
          <span
            className={cn(
              "inline-flex size-14 items-center justify-center rounded-full bg-surface-2 text-accent-strong transition-transform group-hover:scale-105",
              dragOver && "scale-105",
            )}
          >
            <UploadCloud className="size-7" aria-hidden />
          </span>
          <span className="flex flex-col gap-1">
            <span className="font-display text-lg font-semibold text-foreground">
              Drag &amp; drop or click to upload
            </span>
            <span className="text-sm text-muted">JPG, PNG, WEBP · up to {formatBytes(MAX_UPLOAD_BYTES)}</span>
          </span>
        </button>
      )}

      {error && (
        <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
