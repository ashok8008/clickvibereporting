import Link from "next/link";
import {
  Users,
  Tag,
  BarChart3,
  Upload,
  CheckCircle2,
  DollarSign,
  MousePointerClick,
  Download,
  ChevronRight,
} from "lucide-react";
import { getAdminDashboard } from "@/lib/dashboard";
import { dbConnect } from "@/lib/db";
import { Offer } from "@/models";
import { KpiCard } from "@/components/shared/KpiCard";
import { SitePill } from "@/components/shared/SiteColorDot";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const QUICK_NAV = [
  { href: "/admin/offers", title: "Offers", desc: "Manage advertiser offers & payouts", icon: <Tag size={20} />, color: "#6366F1" },
  { href: "/admin/publishers", title: "Publishers", desc: "Onboard partners & media sites", icon: <Users size={20} />, color: "#EC4899" },
  { href: "/admin/reporting", title: "Reporting", desc: "Clicks, conversions & revenue", icon: <BarChart3 size={20} />, color: "#10B981" },
  { href: "/admin/upload", title: "Upload CSV", desc: "Import advertiser conversions", icon: <Upload size={20} />, color: "#F59E0B" },
];

export default async function AdminDashboard() {
  const data = await getAdminDashboard();
  await dbConnect();
  const offers = await Offer.find({ isActive: true }).sort({ payoutValue: -1 }).limit(4).lean();

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-navy via-[#1e3a8a] to-[#312e81] px-8 py-10 md:px-11">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.3)_0%,transparent_70%)]" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="mb-3 inline-block rounded-full border border-indigo/30 bg-indigo/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo">
              Affiliate Intelligence Platform
            </span>
            <h1 className="text-3xl font-black leading-tight text-white md:text-4xl">
              Welcome to <span className="text-success">ClickVibe</span>
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/65">
              Your central hub for affiliate reporting, partner offers and conversion tracking across
              prediction markets and sports betting verticals.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <div className="min-w-[150px] rounded-xl border border-white/10 bg-white/[0.08] px-4 py-3.5 backdrop-blur">
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Total Revenue</div>
              <div className="text-xl font-black text-white">{formatCurrency(data.totalRevenue)}</div>
            </div>
            <div className="min-w-[150px] rounded-xl border border-white/10 bg-white/[0.08] px-4 py-3.5 backdrop-blur">
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Active Offers</div>
              <div className="text-xl font-black text-white">{data.activeOffers}</div>
            </div>
            <div className="min-w-[150px] rounded-xl border border-white/10 bg-white/[0.08] px-4 py-3.5 backdrop-blur">
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Publishers</div>
              <div className="text-xl font-black text-white">{data.activePublishers}</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Clicks" value={formatNumber(data.totalClicks)} icon={<MousePointerClick size={18} />} accent="#6366F1" />
        <KpiCard label="Total Installs" value={formatNumber(data.totalInstalls)} icon={<Download size={18} />} accent="#22C55E" />
        <KpiCard label="Conversions" value={formatNumber(data.totalConversions)} icon={<CheckCircle2 size={18} />} accent="#0D1B4B" />
        <KpiCard label="Total Revenue" value={formatCurrency(data.totalRevenue)} icon={<DollarSign size={18} />} accent="#3B82F6" />
      </div>

      {/* Quick nav */}
      <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-4">
        {QUICK_NAV.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="flex items-center gap-4 rounded-card border border-cardborder bg-white px-5 py-5 transition-all hover:-translate-y-0.5 hover:shadow-cardhover"
          >
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${q.color}1f`, color: q.color }}
            >
              {q.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-navy">{q.title}</h3>
              <p className="text-xs leading-tight text-[#9CA3AF]">{q.desc}</p>
            </div>
            <ChevronRight size={18} className="ml-auto flex-shrink-0 text-[#D1D5DB]" />
          </Link>
        ))}
      </div>

      {/* Two column */}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Recent conversions */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Recent Conversions</CardTitle>
            <Link href="/admin/reporting" className="text-xs font-semibold text-indigo">
              View all →
            </Link>
          </CardHeader>
          <div className="cv-scroll overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr>
                  {["Site", "Promo Code", "Qualified", "Revenue", "Source"].map((h, i) => (
                    <th
                      key={h}
                      className={`border-b border-cardborder bg-[#F8F9FF] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6B7280] ${
                        i >= 2 && i <= 3 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentConversions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-[#9CA3AF]">
                      No conversions yet. Upload a CSV to get started.
                    </td>
                  </tr>
                ) : (
                  data.recentConversions.map((c) => (
                    <tr key={c.id} className="border-b border-[#F3F4F6] hover:bg-[#F8F9FF]">
                      <td className="px-4 py-3 text-sm">
                        {c.siteName ? (
                          <SitePill name={c.siteName} color={c.siteColor ?? "#9CA3AF"} />
                        ) : (
                          <span className="text-[#9CA3AF]">Unmatched</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#374151]">{c.promoCode ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-sm text-[#374151]">{c.qualified}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-navy">{formatCurrency(c.totalCost)}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className="text-[10px]">{c.source === "APPSFLYER" ? "AppsFlyer" : "CSV"}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardBody>
              <h3 className="mb-4 text-sm font-extrabold text-navy">AppsFlyer Sync</h3>
              {data.lastSync ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">Status</span>
                    <Badge color={data.lastSync.status === "success" ? "#22C55E" : "#EF4444"}>
                      {data.lastSync.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">Last run</span>
                    <span className="text-sm font-semibold text-navy">{formatDate(data.lastSync.syncedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">Records</span>
                    <span className="text-sm font-semibold text-navy">{data.lastSync.recordCount}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#9CA3AF]">No syncs run yet.</p>
              )}
              <Link
                href="/admin/appsflyer"
                className="mt-4 block w-full rounded-lg border-[1.5px] border-indigo bg-white py-2.5 text-center text-sm font-bold text-indigo transition-colors hover:bg-indigo hover:text-white"
              >
                Manage Sync →
              </Link>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Featured Offers</CardTitle>
              <Link href="/admin/offers" className="text-xs font-semibold text-indigo">
                See all →
              </Link>
            </CardHeader>
            <div>
              {offers.length === 0 ? (
                <p className="px-5 py-6 text-sm text-[#9CA3AF]">No active offers.</p>
              ) : (
                offers.map((o) => (
                  <div key={String(o._id)} className="flex items-center gap-3 border-b border-[#F3F4F6] px-5 py-3 last:border-b-0">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo to-indigo-dark text-xs font-black text-white">
                      {o.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-navy">{o.name}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{o.type} · {o.appsflyerAppId}</div>
                    </div>
                    <div className="flex-shrink-0 text-sm font-extrabold text-success">
                      {formatCurrency(o.payoutValue, o.payoutCurrency)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
