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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Sync failed");
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
