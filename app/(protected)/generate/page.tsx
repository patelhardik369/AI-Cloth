import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { GenerateWizard } from "@/components/generate-wizard";

export const metadata: Metadata = {
  title: "New shoot",
};

export default async function GeneratePage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  return <GenerateWizard userId={user.id} />;
}
