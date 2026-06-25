import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DAILY_GENERATION_LIMIT } from "@/lib/constants";
import type { Profile, UsageStats } from "@/types";

/** Verified current user (contacts the auth server), or null. */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return (data ?? null) as Profile | null;
}

/** ISO timestamp for local midnight (start of today). */
export function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** ISO timestamp for the next local midnight (when the daily limit resets). */
export function nextMidnight(): string {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.toISOString();
}

/**
 * Count today's generations that consumed a model call (in-flight or done).
 * Failed attempts do not count against the user.
 */
export async function countTodayUsage(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfToday())
    .in("status", ["generating", "completed"]);
  return count ?? 0;
}

/** Usage snapshot for the dashboard / header. */
export async function getDailyUsage(userId: string): Promise<UsageStats> {
  const used = await countTodayUsage(userId);
  return {
    used,
    limit: DAILY_GENERATION_LIMIT,
    remaining: Math.max(0, DAILY_GENERATION_LIMIT - used),
    resetsAt: nextMidnight(),
  };
}
