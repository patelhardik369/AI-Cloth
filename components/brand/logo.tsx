import Link from "next/link";
import { cn } from "@/lib/utils";

/** Refined editorial wordmark: an ink monogram + Fraunces wordmark. */
export function Logo({
  className,
  href = "/",
  showText = true,
}: {
  className?: string;
  href?: string;
  showText?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5 focus-visible:outline-none", className)}
      aria-label="Sari AI — home"
    >
      <span className="relative inline-flex size-9 items-center justify-center rounded-sm bg-primary text-primary-foreground transition-transform group-hover:-translate-y-px">
        <span className="font-display text-[1.15rem] italic leading-none">S</span>
        <span
          aria-hidden
          className="absolute -right-1 -top-1 size-2 rounded-full bg-accent ring-2 ring-background"
        />
      </span>
      {showText && (
        <span className="font-display text-[1.3rem] leading-none tracking-tight text-foreground">
          Sari
          <span className="ml-1 align-top font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-accent-strong">
            AI
          </span>
        </span>
      )}
    </Link>
  );
}
