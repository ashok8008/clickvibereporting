import { AppShell } from "@/components/layout/AppShell";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PublisherLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("PUBLISHER");
  return (
    <AppShell
      role="PUBLISHER"
      userName={session.user.name || "Publisher"}
      userEmail={session.user.email || ""}
    >
      {children}
    </AppShell>
  );
}
