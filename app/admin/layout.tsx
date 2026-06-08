import { AppShell } from "@/components/layout/AppShell";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("ADMIN");
  return (
    <AppShell
      role="ADMIN"
      userName={session.user.name || "Admin"}
      userEmail={session.user.email || ""}
    >
      {children}
    </AppShell>
  );
}
