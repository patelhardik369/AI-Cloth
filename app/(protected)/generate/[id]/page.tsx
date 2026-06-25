import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PastGenerationView } from "@/components/past-generation-view";
import type { Generation } from "@/types";

export const metadata: Metadata = {
  title: "Shoot",
};

export default async function PastGenerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS ensures the row is only returned if it belongs to the signed-in user.
  const { data } = await supabase.from("generations").select("*").eq("id", id).single();

  if (!data) notFound();

  return <PastGenerationView generation={data as Generation} />;
}
