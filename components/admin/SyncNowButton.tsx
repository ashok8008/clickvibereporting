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
      const results: Array<{
        skipped?: boolean;
        status: string;
        reason?: string;
        error?: string;
        offerName?: string;
      }> = data.results ?? [];
      const skipped = results.filter((r) => r.skipped);
      const synced = results.filter((r) => !r.skipped && r.status === "success");
      const errors = results.filter((r) => !r.skipped && r.status === "error");
      const quota = results.filter(
        (r) => r.skipped && r.reason === "quota exceeded"
      );

      if (quota.length > 0) {
        alert(
          "AppsFlyer daily download quota reached for this app. Data will refresh automatically tomorrow at 06:00 UTC. No further API calls were made."
        );
      } else if (skipped.length > 0 && synced.length === 0 && errors.length === 0) {
        alert("Already synced for yesterday — no API calls made.");
      } else if (errors.length > 0) {
        const msg = errors.map((r) => `${r.offerName}: ${r.error}`).join("\n");
        alert(msg);
      } else if (synced.length > 0) {
        alert(`Synced ${synced.length} offer(s) successfully.`);
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
