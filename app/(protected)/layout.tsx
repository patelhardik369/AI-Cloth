import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader email={user.email ?? ""} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
