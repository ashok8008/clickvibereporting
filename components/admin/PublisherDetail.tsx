"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, MousePointerClick } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { SitePill } from "@/components/shared/SiteColorDot";
import { KpiCard } from "@/components/shared/KpiCard";
import { TrackingLinkConfig, type LinkCombo } from "./TrackingLinkConfig";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { hexToRgba } from "@/lib/color-palette";
import type { ReportResult } from "@/lib/reporting";

interface SiteCard {
  id: string;
  name: string;
  url: string | null;
  color: string;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface Props {
  publisher: { id: string; name: string; email: string };
  sites: SiteCard[];
  assignedOffers: { id: string; name: string; type: string; payoutValue: number; currency: string }[];
  availableOffers: { id: string; name: string }[];
  combos: LinkCombo[];
  performance: ReportResult;
}

export function PublisherDetail({
  publisher,
  sites,
  assignedOffers,
  availableOffers,
  combos,
  performance,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState("sites");
  const [siteModal, setSiteModal] = useState(false);
  const [newSite, setNewSite] = useState({ name: "", url: "" });
  const [assignOfferId, setAssignOfferId] = useState("");
  const [busy, setBusy] = useState(false);

  const addSite = async () => {
    if (!newSite.name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publisherId: publisher.id, name: newSite.name, url: newSite.url }),
      });
      if (res.ok) {
        setSiteModal(false);
        setNewSite({ name: "", url: "" });
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const deleteSite = async (id: string) => {
    if (!confirm("Delete this site and its tracking links?")) return;
    await fetch(`/api/sites/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const assignOffer = async () => {
    if (!assignOfferId) return;
    await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId: assignOfferId, publisherId: publisher.id }),
    });
    setAssignOfferId("");
    router.refresh();
  };

  const removeOffer = async (offerId: string) => {
    await fetch(`/api/assignments?offerId=${offerId}&publisherId=${publisher.id}`, { method: "DELETE" });
    router.refresh();
  };

  const tabs = [
    { id: "sites", label: `Media Sites (${sites.length})` },
    { id: "offers", label: `Assigned Offers (${assignedOffers.length})` },
    { id: "links", label: "Tracking Links" },
    { id: "performance", label: "Performance" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/admin/publishers" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-indigo">
          <ArrowLeft size={15} /> Back to publishers
        </Link>
        <h2 className="text-xl font-bold text-navy">{publisher.name}</h2>
        <p className="text-sm text-[#6B7280]">{publisher.email}</p>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* Sites */}
      {tab === "sites" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={() => setSiteModal(true)}>
              <Plus size={16} /> Add Site
            </Button>
          </div>
          {sites.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">No sites yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sites.map((s) => (
                <Card key={s.id} className="overflow-hidden" style={{ borderLeft: `4px solid ${s.color}` }}>
                  <CardBody>
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-black"
                          style={{ backgroundColor: hexToRgba(s.color, 0.15), color: s.color }}
                        >
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-navy">{s.name}</div>
                          {s.url && <div className="text-[11px] text-[#9CA3AF]">{s.url}</div>}
                        </div>
                      </div>
                      <button onClick={() => deleteSite(s.id)}>
                        <Trash2 size={15} className="text-[#9CA3AF] hover:text-[#EF4444]" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-[#F8F9FF] py-2">
                        <div className="text-sm font-extrabold text-navy">{formatNumber(s.clicks)}</div>
                        <div className="text-[10px] uppercase text-[#9CA3AF]">Clicks</div>
                      </div>
                      <div className="rounded-lg bg-[#F8F9FF] py-2">
                        <div className="text-sm font-extrabold text-navy">{formatNumber(s.conversions)}</div>
                        <div className="text-[10px] uppercase text-[#9CA3AF]">Conv.</div>
                      </div>
                      <div className="rounded-lg bg-[#F8F9FF] py-2">
                        <div className="text-sm font-extrabold text-success">{formatCurrency(s.revenue)}</div>
                        <div className="text-[10px] uppercase text-[#9CA3AF]">Rev.</div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assigned Offers */}
      {tab === "offers" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[200px]">
              <Label>Assign an offer</Label>
              <Select value={assignOfferId} onChange={(e) => setAssignOfferId(e.target.value)}>
                <option value="">Select offer…</option>
                {availableOffers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={assignOffer} disabled={!assignOfferId}>
              Assign
            </Button>
          </div>
          {assignedOffers.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">No offers assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {assignedOffers.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-cardborder px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-navy">{o.name}</span>
                    <Badge color="#6366F1">{o.type}</Badge>
                    <span className="text-sm font-semibold text-success">
                      {formatCurrency(o.payoutValue, o.currency)}
                    </span>
                  </div>
                  <button onClick={() => removeOffer(o.id)} className="text-xs font-semibold text-[#EF4444] hover:underline">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tracking Links */}
      {tab === "links" && (
        <div className="flex flex-col gap-3">
          {combos.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">
              Assign an offer and add sites to configure tracking links.
            </p>
          ) : (
            combos.map((c) => <TrackingLinkConfig key={`${c.offerId}:${c.siteId}`} combo={c} />)
          )}
        </div>
      )}

      {/* Performance */}
      {tab === "performance" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Clicks" value={formatNumber(performance.kpis.totalClicks)} icon={<MousePointerClick size={18} />} />
            <KpiCard label="Installs" value={formatNumber(performance.kpis.totalInstalls)} accent="#22C55E" />
            <KpiCard label="Conversions" value={formatNumber(performance.kpis.totalConversions)} accent="#0D1B4B" />
            <KpiCard label="Revenue" value={formatCurrency(performance.kpis.totalRevenue)} accent="#3B82F6" />
          </div>
          <Card className="overflow-hidden">
            <div className="cv-scroll overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr>
                    {["Site", "Promo", "Clicks", "Signups", "Depositors", "Qualified", "Cost"].map((h, i) => (
                      <th key={h} className={`border-b border-cardborder bg-[#F8F9FF] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6B7280] ${i >= 2 ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {performance.rows.filter((r) => r.type === "site").length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-[#9CA3AF]">No performance data yet.</td>
                    </tr>
                  ) : (
                    performance.rows
                      .filter((r) => r.type !== "publisherSubtotal")
                      .map((r, i) =>
                        r.type === "grandTotal" ? (
                          <tr key={i} className="border-t-2 border-indigo bg-[#F0F2FA]">
                            <td className="px-4 py-3 text-sm font-extrabold text-navy" colSpan={2}>Total</td>
                            <td className="px-4 py-3 text-right text-sm font-extrabold text-navy">{formatNumber(r.clicks)}</td>
                            <td className="px-4 py-3 text-right text-sm font-extrabold text-navy">{formatNumber(r.signups)}</td>
                            <td className="px-4 py-3 text-right text-sm font-extrabold text-navy">{formatNumber(r.depositors)}</td>
                            <td className="px-4 py-3 text-right text-sm font-extrabold text-navy">{formatNumber(r.qualified)}</td>
                            <td className="px-4 py-3 text-right text-sm font-extrabold text-navy">{formatCurrency(r.totalCost)}</td>
                          </tr>
                        ) : (
                          <tr key={i} className="border-b border-[#F3F4F6]" style={{ borderLeft: `3px solid ${r.siteColor ?? "#E8EAEF"}` }}>
                            <td className="px-4 py-3 text-sm">
                              <SitePill name={r.siteName ?? r.label} color={r.siteColor ?? "#9CA3AF"} />
                            </td>
                            <td className="px-4 py-3 text-sm text-[#374151]">{r.promoCode ?? "—"}</td>
                            <td className="px-4 py-3 text-right text-sm">{formatNumber(r.clicks)}</td>
                            <td className="px-4 py-3 text-right text-sm">{formatNumber(r.signups)}</td>
                            <td className="px-4 py-3 text-right text-sm">{formatNumber(r.depositors)}</td>
                            <td className="px-4 py-3 text-right text-sm">{formatNumber(r.qualified)}</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-navy">{formatCurrency(r.totalCost)}</td>
                          </tr>
                        )
                      )
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      <Modal open={siteModal} onClose={() => setSiteModal(false)} title="Add Media Site">
        <div className="space-y-4">
          <div>
            <Label>Site Name</Label>
            <Input value={newSite.name} onChange={(e) => setNewSite({ ...newSite, name: e.target.value })} placeholder="VICE" />
          </div>
          <div>
            <Label>URL (optional)</Label>
            <Input value={newSite.url} onChange={(e) => setNewSite({ ...newSite, url: e.target.value })} placeholder="https://vice.com" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSiteModal(false)}>Cancel</Button>
            <Button onClick={addSite} disabled={busy}>{busy ? "Adding…" : "Add Site"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
