import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Sari AI studio to keep creating campaign-ready fashion shoots.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string; confirm?: string }>;
}) {
  const sp = await searchParams;
  return <LoginForm returnUrl={sp.returnUrl} confirm={sp.confirm === "1"} />;
}
