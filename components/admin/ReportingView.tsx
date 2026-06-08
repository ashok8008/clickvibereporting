"use client";

import { useState } from "react";
import { Users, CheckCircle2, BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/shared/KpiCard";
import { SitePill } from "@/components/shared/SiteColorDot";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversionLineChart } from "@/components/charts/ConversionLineChart";
import { RevenueBarChart } from "@/components/charts/RevenueBarChart";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { ReportResult } from "@/lib/reporting";

interface FilterOptions {
  offers: { id: string; name: string }[];
  publishers: { id: string; name: string }[];
  sites: { id: string; name: string; publisherId: string }[];
}

interface Props {
  scope: "admin" | "publisher";
  initialData: ReportResult;
  filterOptions: FilterOptions;
}

export function ReportingView({ scope, initialData, filterOptions }: Props) {
  const [data, setData] = useState<ReportResult>(initialData);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    offerId: "",
    publisherId: "",
    siteId: "",
    source: "",
  });

  const apply = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    try {
      const res = await fetch(`/api/reporting?${params.toString()}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    setFilters({ from: "", to: "", offerId: "", publisherId: "", siteId: "", source: "" });
    setLoading(true);
    try {
      const res = await fetch(`/api/reporting`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const header = [
      "Publisher",
      "Site",
      "Promo Code",
      "Clicks",
      "Signups",
      "Depositors",
      "Sign→Dep%",
      "Traders",
      "Qualified",
      "Sign→Qual%",
      "CPA",
      "Total Cost",
      "Source",
    ];
    const lines = data.rows
      .filter((r) => r.type === "site")
      .map((r) =>
        [
          r.publisherName ?? "",
          r.siteName ?? r.label,
          r.promoCode ?? "",
          r.clicks,
          r.signups,
          r.depositors,
          r.signupToDepPct ?? "",
          r.traders,
          r.qualified,
          r.signupToQualPct ?? "",
          r.cpa,
          r.totalCost,
          r.source ?? "",
        ].join(",")
      );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "clickvibe-report.csv";
    a.click();
  };

  const sitesForPublisher = filters.publisherId
    ? filterOptions.sites.filter((s) => s.publisherId === filters.publisherId)
    : filterOptions.sites;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-navy">Performance Reporting</h2>
        <p className="text-sm text-[#6B7280]">
          Clicks, conversions and revenue rolled up by publisher and site.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Total Clicks" value={formatNumber(data.kpis.totalClicks)} icon={<Users size={18} />} accent="#6366F1" />
        <KpiCard label="Installs" value={formatNumber(data.kpis.totalInstalls)} icon={<TrendingUp size={18} />} accent="#22C55E" />
        <KpiCard label="Conversions" value={formatNumber(data.kpis.totalConversions)} icon={<CheckCircle2 size={18} />} accent="#0D1B4B" />
        <KpiCard label="Revenue" value={formatCurrency(data.kpis.totalRevenue)} icon={<DollarSign size={18} />} accent="#3B82F6" />
        <KpiCard label="Avg CPA" value={formatCurrency(data.kpis.avgCpa)} icon={<BarChart3 size={18} />} accent="#F59E0B" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversions Over Time</CardTitle>
          </CardHeader>
          <CardBody>
            <ConversionLineChart data={data.timeSeries} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Publisher</CardTitle>
          </CardHeader>
          <CardBody>
            <RevenueBarChart data={data.revenueByPublisher} />
          </CardBody>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-3 rounded-card border border-cardborder bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#6B7280]">From</label>
          <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="w-auto" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#6B7280]">To</label>
          <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="w-auto" />
        </div>
        {scope === "admin" && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Publisher</label>
            <Select
              value={filters.publisherId}
              onChange={(e) => setFilters({ ...filters, publisherId: e.target.value, siteId: "" })}
              className="w-auto min-w-[150px]"
            >
              <option value="">All Publishers</option>
              {filterOptions.publishers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Site</label>
          <Select value={filters.siteId} onChange={(e) => setFilters({ ...filters, siteId: e.target.value })} className="w-auto min-w-[140px]">
            <option value="">All Sites</option>
            {sitesForPublisher.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Offer</label>
          <Select value={filters.offerId} onChange={(e) => setFilters({ ...filters, offerId: e.target.value })} className="w-auto min-w-[140px]">
            <option value="">All Offers</option>
            {filterOptions.offers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Source</label>
          <Select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })} className="w-auto min-w-[130px]">
            <option value="">All Sources</option>
            <option value="APPSFLYER">AppsFlyer</option>
            <option value="CSV_UPLOAD">CSV Upload</option>
          </Select>
        </div>
        <Button onClick={apply} disabled={loading}>
          {loading ? "Loading…" : "Apply"}
        </Button>
        <Button variant="outline" onClick={reset} disabled={loading}>
          Reset
        </Button>
        <Button variant="green" onClick={exportCsv} className="ml-auto">
          ↓ Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Performance Data</CardTitle>
          <span className="text-xs font-medium text-[#888]">
            {data.rows.filter((r) => r.type === "site").length} site rows
          </span>
        </CardHeader>
        <div className="cv-scroll overflow-x-auto">
          {loading ? (
            <div className="space-y-2 p-5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr>
                  {["Site", "Promo Code", "Clicks", "Signups", "Depositors", "Sign→Dep%", "Traders", "Qualified", "Sign→Qual%", "CPA", "Total Cost", "Source"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`whitespace-nowrap border-b border-cardborder bg-[#F8F9FF] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6B7280] ${
                          i >= 2 && i <= 10 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {data.rows.length <= 1 ? (
                  <tr>
                    <td colSpan={12} className="py-10 text-center text-sm text-[#9CA3AF]">
                      No data for the selected filters.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((r, i) => {
                    if (r.type === "grandTotal") {
                      return (
                        <tr key={i} className="border-t-[3px] border-indigo">
                          <td className="bg-navy px-4 py-3.5 text-sm font-extrabold text-white" colSpan={2}>
                            Grand Total
                          </td>
                          <td className="bg-navy px-4 py-3.5 text-right text-sm font-extrabold text-white">{formatNumber(r.clicks)}</td>
                          <td className="bg-navy px-4 py-3.5 text-right text-sm font-extrabold text-white">{formatNumber(r.signups)}</td>
                          <td className="bg-navy px-4 py-3.5 text-right text-sm font-extrabold text-white">{formatNumber(r.depositors)}</td>
                          <td className="bg-navy px-4 py-3.5 text-right text-sm font-extrabold text-white">{r.signupToDepPct != null ? `${r.signupToDepPct}%` : "—"}</td>
                          <td className="bg-navy px-4 py-3.5 text-right text-sm font-extrabold text-white">{formatNumber(r.traders)}</td>
                          <td className="bg-navy px-4 py-3.5 text-right text-sm font-extrabold text-white">{formatNumber(r.qualified)}</td>
                          <td className="bg-navy px-4 py-3.5 text-right text-sm font-extrabold text-white">{r.signupToQualPct != null ? `${r.signupToQualPct}%` : "—"}</td>
                          <td className="bg-navy px-4 py-3.5 text-right text-sm font-extrabold text-white">{formatCurrency(r.cpa)}</td>
                          <td className="bg-navy px-4 py-3.5 text-right text-sm font-extrabold text-white">{formatCurrency(r.totalCost)}</td>
                          <td className="bg-navy px-4 py-3.5 text-white" />
                        </tr>
                      );
                    }
                    if (r.type === "publisherSubtotal") {
                      return (
                        <tr key={i} className="bg-[#F0F2FA]">
                          <td className="px-4 py-2.5 text-sm font-bold text-navy" colSpan={2}>
                            {r.label}
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-navy">{formatNumber(r.clicks)}</td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-navy">{formatNumber(r.signups)}</td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-navy">{formatNumber(r.depositors)}</td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-navy">{r.signupToDepPct != null ? `${r.signupToDepPct}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-navy">{formatNumber(r.traders)}</td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-navy">{formatNumber(r.qualified)}</td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-navy">{r.signupToQualPct != null ? `${r.signupToQualPct}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-navy">{formatCurrency(r.cpa)}</td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-navy">{formatCurrency(r.totalCost)}</td>
                          <td className="px-4 py-2.5" />
                        </tr>
                      );
                    }
                    return (
                      <tr
                        key={i}
                        className="border-b border-[#F3F4F6] transition-colors hover:bg-[#F8F9FF]"
                        style={{ borderLeft: `3px solid ${r.siteColor ?? "#E8EAEF"}` }}
                      >
                        <td className="px-4 py-3 text-sm">
                          <SitePill name={r.siteName ?? r.label} color={r.siteColor ?? "#9CA3AF"} />
                        </td>
                        <td className="px-4 py-3 text-sm text-[#374151]">{r.promoCode ?? "—"}</td>
                        <td className="px-4 py-3 text-right text-sm text-[#374151]">{formatNumber(r.clicks)}</td>
                        <td className="px-4 py-3 text-right text-sm text-[#374151]">{formatNumber(r.signups)}</td>
                        <td className="px-4 py-3 text-right text-sm text-[#374151]">{formatNumber(r.depositors)}</td>
                        <td className="px-4 py-3 text-right text-sm text-[#374151]">{r.signupToDepPct != null ? `${r.signupToDepPct}%` : "—"}</td>
                        <td className="px-4 py-3 text-right text-sm text-[#374151]">{formatNumber(r.traders)}</td>
                        <td className="px-4 py-3 text-right text-sm text-[#374151]">{formatNumber(r.qualified)}</td>
                        <td className="px-4 py-3 text-right text-sm text-[#374151]">{r.signupToQualPct != null ? `${r.signupToQualPct}%` : "—"}</td>
                        <td className="px-4 py-3 text-right text-sm text-[#374151]">{formatCurrency(r.cpa)}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-navy">{formatCurrency(r.totalCost)}</td>
                        <td className="px-4 py-3 text-sm">
                          {r.source && (
                            <Badge className="text-[10px]">
                              {r.source.includes("APPSFLYER") ? "AppsFlyer" : "CSV"}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
