import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-surface-2 text-muted border border-border",
        accent: "bg-accent/10 text-accent-strong border border-accent/25",
        success: "bg-success/12 text-success border border-success/30",
        warning: "bg-amber-500/12 text-amber-700 border border-amber-500/30 dark:text-amber-400",
        danger: "bg-destructive/12 text-destructive border border-destructive/30",
        outline: "border border-border-strong text-muted",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
