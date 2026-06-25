import { cn } from "@/lib/utils";

interface ProgressProps {
  /** 0–100; ignored when `indeterminate` */
  value?: number;
  indeterminate?: boolean;
  className?: string;
}

export function Progress({ value = 0, indeterminate, className }: ProgressProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(value)}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}
    >
      {indeterminate ? (
        <div className="h-full w-2/5 rounded-full bg-accent shimmer" />
      ) : (
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      )}
    </div>
  );
}
