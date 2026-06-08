"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/CopyButton";
import { SitePill } from "@/components/shared/SiteColorDot";

export interface LinkCombo {
  offerId: string;
  offerName: string;
  siteId: string;
  siteName: string;
  siteColor: string;
  link: {
    id: string;
    linkMode: "DIRECT" | "CONVERTED";
    advertiserUrl: string;
    publisherUrl: string;
    clicks: number;
  } | null;
}

export function TrackingLinkConfig({ combo }: { combo: LinkCombo }) {
  const router = useRouter();
  const [mode, setMode] = useState<"DIRECT" | "CONVERTED">("DIRECT");
  const [advertiserUrl, setAdvertiserUrl] = useState(combo.link?.advertiserUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const create = async () => {
    if (!advertiserUrl) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tracking-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: combo.offerId,
          siteId: combo.siteId,
          linkMode: mode,
          advertiserUrl,
        }),
      });
      if (res.ok) router.refresh();
      else alert("Failed to create link");
    } finally {
      setBusy(false);
    }
  };

  const updateDestination = async () => {
    if (!combo.link) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tracking-links/${combo.link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advertiserUrl }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-cardborder p-4"
      style={{ borderLeft: `3px solid ${combo.siteColor}` }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SitePill name={combo.siteName} color={combo.siteColor} />
          <span className="text-sm text-[#9CA3AF]">×</span>
          <span className="text-sm font-semibold text-navy">{combo.offerName}</span>
        </div>
        {combo.link && (
          <Badge color={combo.link.linkMode === "CONVERTED" ? "#6366F1" : "#10B981"}>
            <Lock size={11} /> {combo.link.linkMode}
          </Badge>
        )}
      </div>

      {combo.link ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-[#F8F9FF] px-3 py-2 text-xs text-navy">
              {combo.link.publisherUrl}
            </code>
            <CopyButton value={combo.link.publisherUrl} />
          </div>
          {combo.link.linkMode === "CONVERTED" && (
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
              <MousePointerClick size={13} /> {combo.link.clicks} clicks recorded
            </div>
          )}
          {editing ? (
            <div className="flex gap-2 pt-1">
              <Input value={advertiserUrl} onChange={(e) => setAdvertiserUrl(e.target.value)} placeholder="Destination URL" />
              <Button size="sm" onClick={updateDestination} disabled={busy}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-xs font-semibold text-indigo hover:underline">
              Edit destination URL
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("DIRECT")}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                mode === "DIRECT" ? "border-indigo bg-[#F5F3FF] text-indigo" : "border-cardborder text-[#6B7280]"
              }`}
            >
              DIRECT — publisher gets advertiser URL
            </button>
            <button
              onClick={() => setMode("CONVERTED")}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                mode === "CONVERTED" ? "border-indigo bg-[#F5F3FF] text-indigo" : "border-cardborder text-[#6B7280]"
              }`}
            >
              CONVERTED — route through our redirect
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              value={advertiserUrl}
              onChange={(e) => setAdvertiserUrl(e.target.value)}
              placeholder="https://polymarket-app.onelink.me/S8ac/SITE"
            />
            <Button size="sm" onClick={create} disabled={busy || !advertiserUrl}>
              {busy ? "…" : "Create"}
            </Button>
          </div>
          <p className="text-[11px] text-[#9CA3AF]">
            Link mode is locked once created. You can change the destination URL afterward.
          </p>
        </div>
      )}
    </div>
  );
}
