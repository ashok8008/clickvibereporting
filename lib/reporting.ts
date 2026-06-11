import { dbConnect } from "./db";
import {
  Conversion,
  Click,
  TrackingLink,
  MediaSite,
  Publisher,
  Offer,
} from "@/models";
import { ConversionSource } from "@/models/enums";
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
  clicks: number;
  installs: number;
  signups: number;
  depositors: number;
  traders: number;
  qualified: number;
  totalCost: number;
}

export interface ReportResult {
  rows: ReportRow[];
  kpis: {
    totalClicks: number;
    totalQualified: number;
    conversionRate: number;
    totalRevenue: number;
  };
  timeSeries: { date: string; siteId: string; siteName: string; color: string; conversions: number }[];
  revenueBySite: { siteId: string; name: string; color: string; revenue: number }[];
}

function pctOrNull(num: number, den: number): number | null {
  if (!den) return null;
  return +((num / den) * 100).toFixed(1);
}

/** Qualified-to-click rate; returns 0 when there are no clicks in range. */
function conversionRateKpi(qualified: number, clicks: number): number {
  if (!clicks) return 0;
  return +((qualified / clicks) * 100).toFixed(1);
}

function parseFilterDate(dateStr: string, endOfDay = false): Date {
  const d = new Date(`${dateStr}T00:00:00`);
  if (endOfDay) d.setHours(23, 59, 59, 999);
  return d;
}

function clickDateRange(filters: ReportFilters): FilterQuery<Record<string, unknown>> | undefined {
  if (!filters.from && !filters.to) return undefined;
  const range: Record<string, Date> = {};
  if (filters.from) range.$gte = parseFilterDate(filters.from);
  if (filters.to) range.$lte = parseFilterDate(filters.to, true);
  return range;
}

export async function getReportData(filters: ReportFilters): Promise<ReportResult> {
  await dbConnect();

  const convQuery: FilterQuery<Record<string, unknown>> = {};
  if (filters.offerId) convQuery.offerId = filters.offerId;
  if (filters.siteId) convQuery.siteId = filters.siteId;
  if (filters.source) convQuery.source = filters.source;
  if (filters.from || filters.to) {
    convQuery.periodStart = {};
    if (filters.from) (convQuery.periodStart as Record<string, Date>).$gte = parseFilterDate(filters.from);
    if (filters.to) (convQuery.periodStart as Record<string, Date>).$lte = parseFilterDate(filters.to, true);
  }

  const [allSites, publishers, offers] = await Promise.all([
    MediaSite.find().lean(),
    Publisher.find().lean(),
    Offer.find().lean(),
  ]);

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

  const links = await TrackingLink.find().lean();
  const linkToSite = new Map(links.map((l) => [String(l._id), String(l.siteId)]));
  const linkIds = scopedSiteIds
    ? links.filter((l) => scopedSiteIds!.includes(String(l.siteId))).map((l) => l._id)
    : links.map((l) => l._id);

  const clickMatch: FilterQuery<Record<string, unknown>> = {
    trackingLinkId: { $in: linkIds },
  };
  const clickedAt = clickDateRange(filters);
  if (clickedAt) clickMatch.clickedAt = clickedAt;
  if (filters.siteId) {
    const siteLinkIds = links
      .filter((l) => String(l.siteId) === filters.siteId)
      .map((l) => l._id);
    clickMatch.trackingLinkId = { $in: siteLinkIds };
  }

  const clickAgg = await Click.aggregate([
    { $match: clickMatch },
    { $group: { _id: "$trackingLinkId", count: { $sum: 1 } } },
  ]);
  const clicksBySite = new Map<string, number>();
  for (const c of clickAgg) {
    const siteId = linkToSite.get(String(c._id));
    if (siteId) clicksBySite.set(siteId, (clicksBySite.get(siteId) || 0) + c.count);
  }

  const totalScopedClicks = [...clicksBySite.entries()]
    .filter(([siteId]) => {
      if (filters.siteId) return siteId === filters.siteId;
      if (scopedSiteIds) return scopedSiteIds.includes(siteId);
      return true;
    })
    .reduce((sum, [, count]) => sum + count, 0);

  const siteById = new Map(allSites.map((s) => [String(s._id), s]));
  const pubById = new Map(publishers.map((p) => [String(p._id), p]));

  interface SiteAgg {
    siteId: string | null;
    publisherId: string | null;
    installs: number;
    signups: number;
    depositors: number;
    traders: number;
    qualified: number;
    totalCost: number;
  }

  const bySite = new Map<string, SiteAgg>();
  const timeSeriesMap = new Map<string, number>();

  for (const c of conversions) {
    const siteId = c.siteId ? String(c.siteId) : null;
    const site = siteId ? siteById.get(siteId) : null;
    const publisherId = site ? String(site.publisherId) : null;
    const key = siteId ?? "__unmatched__";
    if (!bySite.has(key)) {
      bySite.set(key, {
        siteId,
        publisherId,
        installs: 0,
        signups: 0,
        depositors: 0,
        traders: 0,
        qualified: 0,
        totalCost: 0,
      });
    }
    const agg = bySite.get(key)!;

    if (c.source === ConversionSource.APPSFLYER) {
      agg.installs += c.signups || 0;
    } else {
      agg.signups += c.signups || 0;
    }
    agg.depositors += c.depositors || 0;
    agg.traders += c.traders || 0;
    agg.qualified += c.qualified || 0;
    agg.totalCost += c.totalCost || 0;

    if (siteId && c.periodStart) {
      const date = new Date(c.periodStart).toISOString().slice(0, 10);
      const tkey = `${date}|${siteId}`;
      timeSeriesMap.set(tkey, (timeSeriesMap.get(tkey) || 0) + (c.qualified || 0));
    }
  }

  const rows: ReportRow[] = [];
  const revenueBySite = new Map<string, number>();

  const publisherOrder = [...pubById.values()].sort((a, b) => a.name.localeCompare(b.name));

  let grand = {
    clicks: 0,
    installs: 0,
    signups: 0,
    depositors: 0,
    traders: 0,
    qualified: 0,
    totalCost: 0,
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
      clicks,
      installs: agg.installs,
      signups: agg.signups,
      depositors: agg.depositors,
      traders: agg.traders,
      qualified: agg.qualified,
      totalCost: agg.totalCost,
    });
    if (agg.siteId) revenueBySite.set(agg.siteId, agg.totalCost);
    grand.clicks += clicks;
    grand.installs += agg.installs;
    grand.signups += agg.signups;
    grand.depositors += agg.depositors;
    grand.traders += agg.traders;
    grand.qualified += agg.qualified;
    grand.totalCost += agg.totalCost;
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
      installs: 0,
      signups: 0,
      depositors: 0,
      traders: 0,
      qualified: 0,
      totalCost: 0,
    };
    for (const agg of siteAggs) {
      emitSiteRow(agg);
      const clicks = agg.siteId ? clicksBySite.get(agg.siteId) || 0 : 0;
      sub.clicks += clicks;
      sub.installs += agg.installs;
      sub.signups += agg.signups;
      sub.depositors += agg.depositors;
      sub.traders += agg.traders;
      sub.qualified += agg.qualified;
      sub.totalCost += agg.totalCost;
    }

    rows.push({
      type: "publisherSubtotal",
      label: `${pub.name} subtotal`,
      publisherId: pubId,
      publisherName: pub.name,
      siteId: null,
      siteName: null,
      siteColor: null,
      clicks: sub.clicks,
      installs: sub.installs,
      signups: sub.signups,
      depositors: sub.depositors,
      traders: sub.traders,
      qualified: sub.qualified,
      totalCost: sub.totalCost,
    });
  }

  const unmatched = bySite.get("__unmatched__");
  if (unmatched && !filters.publisherId) {
    emitSiteRow(unmatched);
    revenueBySite.set("__unmatched__", unmatched.totalCost);
  }

  rows.push({
    type: "grandTotal",
    label: "Grand total",
    publisherId: null,
    publisherName: null,
    siteId: null,
    siteName: null,
    siteColor: null,
    clicks: totalScopedClicks,
    installs: grand.installs,
    signups: grand.signups,
    depositors: grand.depositors,
    traders: grand.traders,
    qualified: grand.qualified,
    totalCost: grand.totalCost,
  });

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

  const revenueBySiteArr = [...revenueBySite.entries()]
    .filter(([id]) => id !== "__unmatched__")
    .map(([id, revenue]) => {
      const site = siteById.get(id);
      return {
        siteId: id,
        name: site?.name ?? "Unknown",
        color: site?.colorAccent ?? "#9CA3AF",
        revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return {
    rows,
    kpis: {
      totalClicks: totalScopedClicks,
      totalQualified: grand.qualified,
      conversionRate: conversionRateKpi(grand.qualified, totalScopedClicks),
      totalRevenue: grand.totalCost,
    },
    timeSeries,
    revenueBySite: revenueBySiteArr,
  };
}
