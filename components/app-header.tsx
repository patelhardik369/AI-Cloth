"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, Plus } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

export function AppHeader({ email }: { email: string }) {
  const initial = (email?.[0] || "U").toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Logo href="/dashboard" />
          <Link
            href="/dashboard"
            className="hidden items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground sm:inline-flex"
          >
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/generate"
            className={cn(buttonVariants({ variant: "primary", size: "sm" }), "gap-1.5")}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">New shoot</span>
          </Link>

          <ThemeToggle />

          {/* User menu (native <details> for reliable click-outside) */}
          <details className="group relative">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {initial}
            </summary>
            <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-lift animate-fade-up">
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs text-muted">Signed in as</p>
                <p className="truncate text-sm font-medium text-foreground">{email}</p>
              </div>
              <form action={signOut} className="p-2">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 cursor-pointer"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
