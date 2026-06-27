import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { DashboardStats } from "@/components/dashboard-stats";
import { GenerationCard } from "@/components/generation-card";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import type { Generation } from "@/types";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  // Only show finished shoots — failed/in-flight attempts are hidden (and failed
  // ones are cleaned up server-side), so the gallery stays clean.
  const { data } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const generations: Generation[] = data ?? [];
  const totalGenerations = generations.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Page header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-fade-up">
          <p className="kicker">Your studio</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 max-w-prose text-sm text-muted sm:text-base">
            Your AI fashion shoots, ready to browse and download.
          </p>
        </div>
        <Link
          href="/generate"
          className={cn(
            buttonVariants({ variant: "primary", size: "md" }),
            "shrink-0 gap-1.5 self-start sm:self-auto",
          )}
        >
          <Plus className="size-4" aria-hidden />
          New shoot
        </Link>
      </header>

      {/* Totals */}
      <div className="mt-8">
        <DashboardStats totalGenerations={totalGenerations} />
      </div>

      {/* Recent shoots */}
      <section className="mt-12">
        <div className="flex items-center gap-4">
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
            Recent shoots
          </h2>
          <span className="hairline flex-1" aria-hidden />
          {totalGenerations > 0 && (
            <span className="shrink-0 text-xs tabular-nums text-muted">
              {totalGenerations} {totalGenerations === 1 ? "shoot" : "shoots"}
            </span>
          )}
        </div>

        {generations.length === 0 ? (
          <div className="mt-10">
            <EmptyState />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {generations.map((generation) => (
              <GenerationCard key={generation.id} generation={generation} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
