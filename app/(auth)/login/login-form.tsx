"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Lock, Mail, MailCheck } from "lucide-react";
import { signIn } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm({
  returnUrl,
  confirm,
}: {
  returnUrl?: string;
  confirm?: boolean;
}) {
  const [state, formAction, pending] = useActionState(signIn, {});
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Card className="animate-fade-up shadow-lift">
      <CardHeader className="space-y-1.5">
        <span className="kicker">Sari AI Studio</span>
        <CardTitle className="font-display text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Log in to continue creating campaign-ready shoots.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {confirm && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/10 p-3.5 text-sm"
          >
            <MailCheck className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden />
            <p className="text-foreground">
              Check your inbox to confirm your email, then log in.
            </p>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="returnUrl" value={returnUrl ?? ""} />

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@studio.com"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="pl-10 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-0 top-0 inline-flex size-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {state.error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {state.error}
            </p>
          )}

          <Button type="submit" size="lg" loading={pending} className="w-full">
            Log in
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          New here?{" "}
          <Link
            href="/signup"
            className="font-medium text-accent-strong underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
