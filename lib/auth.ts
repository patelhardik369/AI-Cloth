import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

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
