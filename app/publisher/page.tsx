import { MousePointerClick, CheckCircle2, DollarSign } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getPublisherDashboard } from "@/lib/dashboard";
import { SitePill } from "@/components/shared/SiteColorDot";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/CopyButton";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { hexToRgba } from "@/lib/color-palette";

export const dynamic = "force-dynamic";

export default async function PublisherDashboard() {
  const session = await requireRole("PUBLISHER");
  const publisherId = session.user.publisherId;

  if (!publisherId) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-[#6B7280]">No publisher profile is linked to your account.</p>
        </CardBody>
      </Card>
    );
  }

  const data = await getPublisherDashboard(publisherId);

  const summaryMetrics = [
    { label: "Total Clicks", value: formatNumber(data.totalClicks), icon: <MousePointerClick size={16} /> },
    { label: "Total Qualified", value: formatNumber(data.totalQualified), icon: <CheckCircle2 size={16} /> },
    { label: "Total Revenue", value: formatCurrency(data.totalRevenue), icon: <DollarSign size={16} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-navy via-[#1e3a8a] to-[#312e81] px-8 py-9">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.3)_0%,transparent_70%)]" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="mb-2 inline-block rounded-full border border-indigo/30 bg-indigo/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo">
              Publisher Portal
            </span>
            <h1 className="text-2xl font-black text-white md:text-3xl">{data.publisherName}</h1>
            <p className="mt-1 text-sm text-white/65">Your sites, tracking links and live performance.</p>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Month To Date</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {summaryMetrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-white/12 bg-white/8 px-4 py-3 backdrop-blur-sm"
                >
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-white/50">
                    {m.icon}
                    {m.label}
                  </div>
                  <div className="text-xl font-black text-white">{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* My Sites */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-navy">My Sites</h2>
        {data.sites.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">No sites configured. Contact your account manager.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.sites.map((s) => (
              <Card key={s.id} style={{ borderLeft: `4px solid ${s.color}` }}>
                <CardBody>
                  <div className="mb-3 flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-black"
                      style={{ backgroundColor: hexToRgba(s.color, 0.15), color: s.color }}
                    >
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-sm font-bold text-navy">{s.name}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-[#F8F9FF] py-2">
                      <div className="text-sm font-extrabold text-navy">{formatNumber(s.clicks)}</div>
                      <div className="text-[10px] uppercase text-[#9CA3AF]">Clicks</div>
                    </div>
                    <div className="rounded-lg bg-[#F8F9FF] py-2">
                      <div className="text-sm font-extrabold text-navy">{formatNumber(s.qualified)}</div>
                      <div className="text-[10px] uppercase text-[#9CA3AF]">Qualified</div>
                    </div>
                    <div className="rounded-lg bg-[#F8F9FF] py-2">
                      <div className="text-sm font-extrabold text-success">{formatCurrency(s.revenue)}</div>
                      <div className="text-[10px] uppercase text-[#9CA3AF]">Revenue</div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* My Tracking Links */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>My Tracking Links</CardTitle>
        </CardHeader>
        <div className="cv-scroll overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr>
                {["Site", "Offer", "Mode", "Tracking URL", ""].map((h) => (
                  <th key={h} className="border-b border-cardborder bg-[#F8F9FF] px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.links.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-[#9CA3AF]">
                    No tracking links assigned yet.
                  </td>
                </tr>
              ) : (
                data.links.map((l) => (
                  <tr key={l.id} className="border-b border-[#F3F4F6] hover:bg-[#F8F9FF]" style={{ borderLeft: `3px solid ${l.siteColor}` }}>
                    <td className="px-4 py-3 text-sm">
                      <SitePill name={l.siteName} color={l.siteColor} />
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-navy">{l.offerName}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge color={l.linkMode === "CONVERTED" ? "#6366F1" : "#10B981"}>{l.linkMode}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <code className="block max-w-[280px] truncate rounded-md bg-[#F8F9FF] px-2.5 py-1.5 text-xs text-navy">
                        {l.url || "—"}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-right">{l.url && <CopyButton value={l.url} />}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
