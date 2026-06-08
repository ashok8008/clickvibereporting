"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SyncNowButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/appsflyer/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Sync failed");
        return;
      }
      const skipped = (data.results ?? []).filter((r: { skipped?: boolean }) => r.skipped).length;
      const synced = (data.results ?? []).filter(
        (r: { skipped?: boolean; status: string }) => !r.skipped && r.status === "success"
      ).length;
      if (skipped > 0 && synced === 0) {
        alert("Already synced for yesterday — no API calls made.");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={run} disabled={busy}>
      <RefreshCw size={16} className={busy ? "animate-spin" : ""} /> {busy ? "Syncing…" : "Sync Now"}
    </Button>
  );
}
