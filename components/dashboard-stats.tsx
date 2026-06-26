import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Images } from "lucide-react";
import { Card } from "@/components/ui/card";

function StatCard({
  label,
  value,
  icon: Icon,
  children,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          {label}
        </span>
        <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent-strong">
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-display text-4xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <div className="mt-auto pt-4">{children}</div>
    </Card>
  );
}

/** All-time totals strip for the dashboard. */
export function DashboardStats({ totalGenerations }: { totalGenerations: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:max-w-xs">
      <StatCard label="Total shoots" value={totalGenerations} icon={Images}>
        <p className="text-xs text-muted">Creations all-time</p>
      </StatCard>
    </div>
  );
}
