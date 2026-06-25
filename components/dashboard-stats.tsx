import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Gauge, Images, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UsageStats } from "@/types";

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

/** Daily usage + all-time totals strip for the dashboard. */
export function DashboardStats({
  usage,
  totalGenerations,
}: {
  usage: UsageStats;
  totalGenerations: number;
}) {
  const pct = usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      <StatCard label="Used today" value={usage.used} icon={Sparkles}>
        <Progress value={pct} />
        <p className="mt-2 text-xs text-muted">
          {usage.remaining} left · resets at midnight
        </p>
      </StatCard>

      <StatCard label="Daily limit" value={usage.limit} icon={Gauge}>
        <p className="text-xs text-muted">Generations available each day</p>
      </StatCard>

      <StatCard label="Total shoots" value={totalGenerations} icon={Images}>
        <p className="text-xs text-muted">Creations all-time</p>
      </StatCard>
    </div>
  );
}
