import Link from "next/link";
import { Plus, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shown on the dashboard when the user has no generations yet.
 * Server component — purely presentational.
 */
export function EmptyState() {
  return (
    <Card className="mx-auto max-w-xl animate-fade-up p-10 text-center sm:p-12">
      {/* Accent medallion with a soft radial glow */}
      <div className="relative mx-auto mb-7 flex size-20 items-center justify-center">
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-6 rounded-full blur-2xl"
          style={{
            background:
              "radial-gradient(circle at center, var(--color-clay-400) 0%, transparent 68%)",
            opacity: 0.3,
          }}
        />
        <span className="relative flex size-20 items-center justify-center rounded-full border border-accent/30 bg-accent/15">
          <Wand2 className="size-9 text-accent-strong" aria-hidden />
        </span>
      </div>

      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Create your first shoot
      </h2>
      <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-muted">
        Upload a photo of any garment and watch our AI style it on a fashion model
        against a runway-worthy backdrop, then export it as a poster-ready 4K image.
      </p>

      <Link
        href="/generate"
        className={cn(buttonVariants({ variant: "primary", size: "md" }), "mt-7 gap-1.5")}
      >
        <Plus className="size-4" aria-hidden />
        New shoot
      </Link>
    </Card>
  );
}
