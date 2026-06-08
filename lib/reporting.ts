import { dbConnect } from "./db";
import {
  Conversion,
  Click,
  TrackingLink,
  MediaSite,
  Publisher,
  Offer,
} from "@/models";
import type { FilterQuery } from "mongoose";

export interface ReportFilters {
  from?: string;
  to?: string;
  offerId?: string;
  publisherId?: string;
  siteId?: string;
  source?: string;
}

export interface ReportRow {
  type: "site" | "publisherSubtotal" | "grandTotal";
  label: string;
  publisherId: string | null;
  publisherName: string | null;
  siteId: string | null;
  siteName: string | null;
  siteColor: string | null;
  promoCode: string | null;
  clicks: number;
  signups: number;
  depositors: number;
  signupToDepPct: number | null;
  traders: number;
  qualified: number;
  signupToQualPct: number | null;
  cpa: number;
  totalCost: number;
  source: string | null;
}

export interface ReportResult {
  rows: ReportRow[];
  kpis: {
    totalClicks: number;
    totalInstalls: number;
    totalConversions: number;
    totalRevenue: number;
    avgCpa: number;
  };
  timeSeries: { date: string; siteId: string; siteName: string; color: string; conversions: number }[];
  revenueByPublisher: { publisherId: string; name: string; revenue: number }[];
}

function pctOrNull(num: number, den: number): number | null {
  if (!den) return null;
  return +((num / den) * 100).toFixed(1);
}

export async function getReportData(filters: ReportFilters): Promise<ReportResult> {
  await dbConnect();

  const convQuery: FilterQuery<Record<string, unknown>> = {};
  if (filters.offerId) convQuery.offerId = filters.offerId;
  if (filters.siteId) convQuery.siteId = filters.siteId;
  if (filters.source) convQuery.source = filters.source;
  if (filters.from || filters.to) {
    convQuery.periodStart = {};
    if (filters.from) (convQuery.periodStart as Record<string, Date>).$gte = new Date(filters.from);
    if (filters.to) {
      const end = new Date(filters.to);
      end.setHours(23, 59, 59, 999);
      (convQuery.periodStart as Record<string, Date>).$lte = end;
    }
  }

  const [allSites, publishers, offers] = await Promise.all([
    MediaSite.find().lean(),
    Publisher.find().lean(),
    Offer.find().lean(),
  ]);

  // Scope by publisher → restrict to that publisher's sites
  let scopedSiteIds: string[] | null = null;
  if (filters.publisherId) {
    scopedSiteIds = allSites
      .filter((s) => String(s.publisherId) === filters.publisherId)
      .map((s) => String(s._id));
    if (!filters.siteId) {
      convQuery.siteId = { $in: scopedSiteIds };
    }
  }

  const conversions = await Conversion.find(convQuery).lean();

  // Clicks aggregated by site (via tracking links)
  const links = await TrackingLink.find().lean();
  const linkToSite = new Map(links.map((l) => [String(l._id), String(l.siteId)]));
  const clickAgg = await Click.aggregate([
    { $group: { _id: "$trackingLinkId", count: { $sum: 1 } } },
  ]);
  const clicksBySite = new Map<string, number>();
  for (const c of clickAgg) {
    const siteId = linkToSite.get(String(c._id));
    if (siteId) clicksBySite.set(siteId, (clicksBySite.get(siteId) || 0) + c.count);
  }

  const siteById = new Map(allSites.map((s) => [String(s._id), s]));
  const pubById = new Map(publishers.map((p) => [String(p._id), p]));
  const offerName = filters.offerId
    ? offers.find((o) => String(o._id) === filters.offerId)?.name
    : undefined;

  // Group conversions by site (and a bucket for unmatched siteId=null)
  interface SiteAgg {
    siteId: string | null;
    publisherId: string | null;
    promoCodes: Set<string>;
    sources: Set<string>;
    signups: number;
    depositors: number;
    traders: number;
    qualified: number;
    cpaSum: number;
    cpaCount: number;
    totalCost: number;
  }

  const bySite = new Map<string, SiteAgg>();
  const timeSeriesMap = new Map<string, number>(); // key date|siteId

  for (const c of conversions) {
    const siteId = c.siteId ? String(c.siteId) : null;
    const site = siteId ? siteById.get(siteId) : null;
    const publisherId = site ? String(site.publisherId) : null;
    const key = siteId ?? "__unmatched__";
    if (!bySite.has(key)) {
      bySite.set(key, {
        siteId,
        publisherId,
        promoCodes: new Set(),
        sources: new Set(),
        signups: 0,
        depositors: 0,
        traders: 0,
        qualified: 0,
        cpaSum: 0,
        cpaCount: 0,
        totalCost: 0,
      });
    }
    const agg = bySite.get(key)!;
    if (c.promoCode) agg.promoCodes.add(c.promoCode);
    agg.sources.add(c.source);
    agg.signups += c.signups || 0;
    agg.depositors += c.depositors || 0;
    agg.traders += c.traders || 0;
    agg.qualified += c.qualified || 0;
    if (c.cpaPayout) {
      agg.cpaSum += c.cpaPayout;
      agg.cpaCount += 1;
    }
    agg.totalCost += c.totalCost || 0;

    if (siteId && c.periodStart) {
      const date = new Date(c.periodStart).toISOString().slice(0, 10);
      const tkey = `${date}|${siteId}`;
      const convCount = (c.qualified || 0) + (c.depositors || 0) + (c.signups || 0);
      timeSeriesMap.set(tkey, (timeSeriesMap.get(tkey) || 0) + convCount);
    }
  }

  // Order by publisher then site name; group rows with subtotals
  const rows: ReportRow[] = [];
  const revenueByPublisher = new Map<string, number>();

  // Build per-publisher buckets
  const publisherOrder = [...pubById.values()].sort((a, b) => a.name.localeCompare(b.name));

  let grand = {
    clicks: 0,
    signups: 0,
    depositors: 0,
    traders: 0,
    qualified: 0,
    totalCost: 0,
    cpaSum: 0,
    cpaCount: 0,
  };

  const emitSiteRow = (agg: SiteAgg) => {
    const site = agg.siteId ? siteById.get(agg.siteId) : null;
    const pub = agg.publisherId ? pubById.get(agg.publisherId) : null;
    const clicks = agg.siteId ? clicksBySite.get(agg.siteId) || 0 : 0;
    rows.push({
      type: "site",
      label: site?.name ?? "Unmatched",
      publisherId: agg.publisherId,
      publisherName: pub?.name ?? null,
      siteId: agg.siteId,
      siteName: site?.name ?? null,
      siteColor: site?.colorAccent ?? "#9CA3AF",
      promoCode: [...agg.promoCodes].join(", ") || null,
      clicks,
      signups: agg.signups,
      depositors: agg.depositors,
      signupToDepPct: pctOrNull(agg.depositors, agg.signups),
      traders: agg.traders,
      qualified: agg.qualified,
      signupToQualPct: pctOrNull(agg.qualified, agg.signups),
      cpa: agg.cpaCount ? +(agg.cpaSum / agg.cpaCount).toFixed(2) : 0,
      totalCost: agg.totalCost,
      source: [...agg.sources].join(", ") || null,
    });
    grand.clicks += clicks;
    grand.signups += agg.signups;
    grand.depositors += agg.depositors;
    grand.traders += agg.traders;
    grand.qualified += agg.qualified;
    grand.totalCost += agg.totalCost;
    grand.cpaSum += agg.cpaSum;
    grand.cpaCount += agg.cpaCount;
  };

  for (const pub of publisherOrder) {
    const pubId = String(pub._id);
    const siteAggs = [...bySite.values()]
      .filter((a) => a.publisherId === pubId)
      .sort((a, b) => {
        const an = a.siteId ? siteById.get(a.siteId)?.name ?? "" : "";
        const bn = b.siteId ? siteById.get(b.siteId)?.name ?? "" : "";
        return an.localeCompare(bn);
      });
    if (!siteAggs.length) continue;

    const sub = {
      clicks: 0,
      signups: 0,
      depositors: 0,
      traders: 0,
      qualified: 0,
      totalCost: 0,
      cpaSum: 0,
      cpaCount: 0,
    };
    for (const agg of siteAggs) {
      emitSiteRow(agg);
      const clicks = agg.siteId ? clicksBySite.get(agg.siteId) || 0 : 0;
      sub.clicks += clicks;
      sub.signups += agg.signups;
      sub.depositors += agg.depositors;
      sub.traders += agg.traders;
      sub.qualified += agg.qualified;
      sub.totalCost += agg.totalCost;
      sub.cpaSum += agg.cpaSum;
      sub.cpaCount += agg.cpaCount;
    }
    revenueByPublisher.set(pubId, sub.totalCost);

    rows.push({
      type: "publisherSubtotal",
      label: `${pub.name} subtotal`,
      publisherId: pubId,
      publisherName: pub.name,
      siteId: null,
      siteName: null,
      siteColor: null,
      promoCode: null,
      clicks: sub.clicks,
      signups: sub.signups,
      depositors: sub.depositors,
      signupToDepPct: pctOrNull(sub.depositors, sub.signups),
      traders: sub.traders,
      qualified: sub.qualified,
      signupToQualPct: pctOrNull(sub.qualified, sub.signups),
      cpa: sub.cpaCount ? +(sub.cpaSum / sub.cpaCount).toFixed(2) : 0,
      totalCost: sub.totalCost,
      source: null,
    });
  }

  // Unmatched bucket (siteId null, no publisher)
  const unmatched = bySite.get("__unmatched__");
  if (unmatched && (!filters.publisherId)) {
    emitSiteRow(unmatched);
    revenueByPublisher.set("__unmatched__", unmatched.totalCost);
  }

  rows.push({
    type: "grandTotal",
    label: "Grand total",
    publisherId: null,
    publisherName: null,
    siteId: null,
    siteName: null,
    siteColor: null,
    promoCode: null,
    clicks: grand.clicks,
    signups: grand.signups,
    depositors: grand.depositors,
    signupToDepPct: pctOrNull(grand.depositors, grand.signups),
    traders: grand.traders,
    qualified: grand.qualified,
    signupToQualPct: pctOrNull(grand.qualified, grand.signups),
    cpa: grand.cpaCount ? +(grand.cpaSum / grand.cpaCount).toFixed(2) : 0,
    totalCost: grand.totalCost,
    source: null,
  });

  const totalConversions = grand.qualified + grand.depositors;

  const timeSeries = [...timeSeriesMap.entries()]
    .map(([key, conversions]) => {
      const [date, siteId] = key.split("|");
      const site = siteById.get(siteId);
      return {
        date,
        siteId,
        siteName: site?.name ?? "Unknown",
        color: site?.colorAccent ?? "#9CA3AF",
        conversions,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const revenueByPublisherArr = [...revenueByPublisher.entries()]
    .filter(([id]) => id !== "__unmatched__")
    .map(([id, revenue]) => ({
      publisherId: id,
      name: pubById.get(id)?.name ?? "Unknown",
      revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    rows,
    kpis: {
      totalClicks: grand.clicks,
      totalInstalls: grand.signups,
      totalConversions,
      totalRevenue: grand.totalCost,
      avgCpa: grand.cpaCount ? +(grand.cpaSum / grand.cpaCount).toFixed(2) : 0,
    },
    timeSeries,
    revenueByPublisher: revenueByPublisherArr,
  };
}
