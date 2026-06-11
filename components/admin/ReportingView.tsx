"use client";

import { useState } from "react";
import { MousePointerClick, CheckCircle2, DollarSign, Percent } from "lucide-react";
import { KpiCard } from "@/components/shared/KpiCard";
import { SitePill } from "@/components/shared/SiteColorDot";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversionLineChart } from "@/components/charts/ConversionLineChart";
import { RevenueBarChart } from "@/components/charts/RevenueBarChart";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getDateRangeForPreset, type DatePreset } from "@/lib/date-ranges";
import type { ReportResult, ReportRow } from "@/lib/reporting";

interface FilterOptions {
  offers: { id: string; name: string }[];
  publishers: { id: string; name: string }[];
  sites: { id: string; name: string; publisherId: string }[];
}

interface Props {
  scope: "admin" | "publisher";
  initialData: ReportResult;
  filterOptions: FilterOptions;
  defaultPreset?: DatePreset;
}

const TABLE_COLUMNS = ["Site", "Clicks", "Installs", "Signups", "Depositors", "Traders", "Qualified", "Revenue"] as const;

function pctOrNull(num: number, den: number): string | null {
  if (!den) return null;
  return `${+((num / den) * 100).toFixed(1)}%`;
}

function formatFunnelValue(value: number, pct: string | null, showPct: boolean): string {
  if (!showPct || !pct) return formatNumber(value);
  return `${formatNumber(value)} (${pct})`;
}

function FunnelCell({
  row,
  field,
  prevField,
  showPct,
  className,
}: {
  row: ReportRow;
  field: keyof Pick<ReportRow, "clicks" | "installs" | "signups" | "depositors" | "traders" | "qualified">;
  prevField: keyof Pick<ReportRow, "clicks" | "installs" | "signups" | "depositors" | "traders" | "qualified"> | null;
  showPct: boolean;
  className?: string;
}) {
  const value = row[field] as number;
  const prev = prevField ? (row[prevField] as number) : null;
  const pct = prevField && prev != null ? pctOrNull(value, prev) : null;
  return <td className={className}>{formatFunnelValue(value, pct, showPct)}</td>;
}

export function ReportingView({ scope, initialData, filterOptions, defaultPreset = "last7" }: Props) {
  const defaultRange = getDateRangeForPreset(defaultPreset);
  const [data, setData] = useState<ReportResult>(initialData);
  const [loading, setLoading] = useState(false);
  const [showPct, setShowPct] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>(defaultPreset);
  const [dateDraft, setDateDraft] = useState({
    from: defaultRange.from,
    to: defaultRange.to,
  });
  const [filters, setFilters] = useState({
    from: defaultRange.from,
    to: defaultRange.to,
    offerId: "",
    publisherId: "",
    siteId: "",
  });

  const fetchData = async (nextFilters: typeof filters) => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([k, v]) => v && params.set(k, v));
    try {
      const res = await fetch(`/api/reporting?${params.toString()}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const apply = () => fetchData(filters);

  const reset = async () => {
    const next = { ...filters, offerId: "", publisherId: "", siteId: "" };
    setFilters(next);
    await fetchData(next);
  };

  const applyDateRange = async () => {
    if (!dateDraft.from || !dateDraft.to) return;
    const next = { ...filters, from: dateDraft.from, to: dateDraft.to };
    setFilters(next);
    await fetchData(next);
  };

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === "custom") return;
    const range = getDateRangeForPreset(preset);
    setDateDraft({ from: range.from, to: range.to });
  };

  const handleFromChange = (from: string) => {
    setDatePreset("custom");
    setDateDraft((d) => ({ ...d, from }));
  };

  const handleToChange = (to: string) => {
    setDatePreset("custom");
    setDateDraft((d) => ({ ...d, to }));
  };

  const exportCsv = () => {
    const header = ["Publisher", ...TABLE_COLUMNS];
    const lines = data.rows
      .filter((r) => r.type === "site")
      .map((r) =>
        [
          r.publisherName ?? "",
          r.siteName ?? r.label,
          r.clicks,
          r.installs,
          r.signups,
          r.depositors,
          r.traders,
          r.qualified,
          r.totalCost,
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

  const conversionRateDisplay = `${data.kpis.conversionRate}%`;

  const renderFunnelCells = (row: ReportRow, cellClass: string) => (
    <>
      <FunnelCell row={row} field="clicks" prevField={null} showPct={false} className={cellClass} />
      <FunnelCell row={row} field="installs" prevField="clicks" showPct={showPct} className={cellClass} />
      <FunnelCell row={row} field="signups" prevField="installs" showPct={showPct} className={cellClass} />
      <FunnelCell row={row} field="depositors" prevField="signups" showPct={showPct} className={cellClass} />
      <FunnelCell row={row} field="traders" prevField="depositors" showPct={showPct} className={cellClass} />
      <FunnelCell row={row} field="qualified" prevField="traders" showPct={showPct} className={cellClass} />
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <DateRangePicker
        preset={datePreset}
        from={dateDraft.from}
        to={dateDraft.to}
        onPresetChange={handlePresetChange}
        onFromChange={handleFromChange}
        onToChange={handleToChange}
        onApply={applyDateRange}
        applying={loading}
      />

      <div>
        <h2 className="text-lg font-bold text-navy">Performance Reporting</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Clicks" value={formatNumber(data.kpis.totalClicks)} icon={<MousePointerClick size={18} />} accent="#6366F1" />
        <KpiCard label="Qualified" value={formatNumber(data.kpis.totalQualified)} icon={<CheckCircle2 size={18} />} accent="#22C55E" />
        <KpiCard label="Conversion Rate" value={conversionRateDisplay} icon={<Percent size={18} />} accent="#0D1B4B" />
        <KpiCard label="Revenue" value={formatCurrency(data.kpis.totalRevenue)} icon={<DollarSign size={18} />} accent="#3B82F6" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Qualified</CardTitle>
          </CardHeader>
          <CardBody>
            <ConversionLineChart data={data.timeSeries} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Site</CardTitle>
          </CardHeader>
          <CardBody>
            <RevenueBarChart data={data.revenueBySite} />
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-card border border-cardborder bg-white p-4">
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
        <Button onClick={apply} disabled={loading}>
          {loading ? "Loading…" : "Apply"}
        </Button>
        <Button variant="outline" onClick={reset} disabled={loading}>
          Reset
        </Button>
        <Button
          variant={showPct ? "primary" : "outline"}
          onClick={() => setShowPct((v) => !v)}
          disabled={loading}
          title="Toggle funnel conversion percentages"
          className="min-w-[40px] px-3"
        >
          %
        </Button>
        <Button variant="green" onClick={exportCsv} className="ml-auto">
          ↓ Export CSV
        </Button>
      </div>

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
                  {TABLE_COLUMNS.map((h, i) => (
                    <th
                      key={h}
                      className={`whitespace-nowrap border-b border-cardborder bg-[#F8F9FF] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6B7280] ${
                        i >= 1 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.length <= 1 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm text-[#9CA3AF]">
                      No data for the selected filters.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((r, i) => {
                    if (r.type === "grandTotal") {
                      return (
                        <tr key={i} className="border-t-[3px] border-indigo">
                          <td className="bg-navy px-4 py-3.5 text-sm font-extrabold text-white">Grand Total</td>
                          {renderFunnelCells(r, "bg-navy px-4 py-3.5 text-right text-sm font-extrabold text-white")}
                          <td className="bg-navy px-4 py-3.5 text-right text-sm font-extrabold text-white">{formatCurrency(r.totalCost)}</td>
                        </tr>
                      );
                    }
                    if (r.type === "publisherSubtotal") {
                      return (
                        <tr key={i} className="bg-[#F0F2FA]">
                          <td className="px-4 py-2.5 text-sm font-bold text-navy">{r.label}</td>
                          {renderFunnelCells(r, "px-4 py-2.5 text-right text-sm font-bold text-navy")}
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-navy">{formatCurrency(r.totalCost)}</td>
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
                        {renderFunnelCells(r, "px-4 py-3 text-right text-sm text-[#374151]")}
                        <td className="px-4 py-3 text-right text-sm font-bold text-navy">{formatCurrency(r.totalCost)}</td>
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
