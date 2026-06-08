import { dbConnect } from "./db";
import {
  Offer,
  Publisher,
  Conversion,
  Click,
  AppsflyerSync,
  MediaSite,
  TrackingLink,
} from "@/models";

export interface DashboardData {
  totalClicks: number;
  totalInstalls: number;
  totalConversions: number;
  totalRevenue: number;
  activeOffers: number;
  activePublishers: number;
  recentConversions: {
    id: string;
    siteName: string | null;
    siteColor: string | null;
    promoCode: string | null;
    qualified: number;
    depositors: number;
    totalCost: number;
    source: string;
    importedAt: string;
  }[];
  lastSync: { status: string; syncedAt: string; recordCount: number; error?: string } | null;
}

export async function getAdminDashboard(): Promise<DashboardData> {
  await dbConnect();

  const [
    totalClicks,
    convAgg,
    activeOffers,
    activePublishers,
    recent,
    lastSync,
    sites,
  ] = await Promise.all([
    Click.countDocuments(),
    Conversion.aggregate([
      {
        $group: {
          _id: null,
          installs: { $sum: "$signups" },
          qualified: { $sum: "$qualified" },
          depositors: { $sum: "$depositors" },
          revenue: { $sum: "$totalCost" },
        },
      },
    ]),
    Offer.countDocuments({ isActive: true }),
    Publisher.countDocuments(),
    Conversion.find().sort({ importedAt: -1 }).limit(10).lean(),
    AppsflyerSync.findOne().sort({ syncedAt: -1 }).lean(),
    MediaSite.find().lean(),
  ]);

  const siteMap = new Map(sites.map((s) => [String(s._id), s]));
  const agg = convAgg[0] || { installs: 0, qualified: 0, depositors: 0, revenue: 0 };

  return {
    totalClicks,
    totalInstalls: agg.installs || 0,
    totalConversions: (agg.qualified || 0) + (agg.depositors || 0),
    totalRevenue: agg.revenue || 0,
    activeOffers,
    activePublishers,
    recentConversions: recent.map((c) => {
      const site = c.siteId ? siteMap.get(String(c.siteId)) : null;
      return {
        id: String(c._id),
        siteName: site?.name ?? null,
        siteColor: site?.colorAccent ?? null,
        promoCode: c.promoCode ?? null,
        qualified: c.qualified || 0,
        depositors: c.depositors || 0,
        totalCost: c.totalCost || 0,
        source: c.source,
        importedAt: new Date(c.importedAt).toISOString(),
      };
    }),
    lastSync: lastSync
      ? {
          status: lastSync.status,
          syncedAt: new Date(lastSync.syncedAt).toISOString(),
          recordCount: lastSync.recordCount,
          error: lastSync.error,
        }
      : null,
  };
}

export interface PublisherDashboardData {
  publisherName: string;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  sites: {
    id: string;
    name: string;
    url: string | null;
    color: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }[];
  links: {
    id: string;
    offerName: string;
    siteName: string;
    siteColor: string;
    linkMode: string;
    url: string;
    clicks: number;
  }[];
}

export async function getPublisherDashboard(publisherId: string): Promise<PublisherDashboardData> {
  await dbConnect();

  const publisher = await Publisher.findById(publisherId).lean();
  const sites = await MediaSite.find({ publisherId }).lean();
  const siteIds = sites.map((s) => s._id);

  const links = await TrackingLink.find({ siteId: { $in: siteIds } }).lean();
  const linkIds = links.map((l) => l._id);
  const offers = await Offer.find().lean();
  const offerMap = new Map(offers.map((o) => [String(o._id), o]));

  // Clicks per link (CONVERTED only contribute to publisher click totals)
  const clickAgg = await Click.aggregate([
    { $match: { trackingLinkId: { $in: linkIds } } },
    { $group: { _id: "$trackingLinkId", count: { $sum: 1 } } },
  ]);
  const clicksByLink = new Map(clickAgg.map((c) => [String(c._id), c.count]));

  const convAgg = await Conversion.aggregate([
    { $match: { siteId: { $in: siteIds } } },
    {
      $group: {
        _id: "$siteId",
        qualified: { $sum: "$qualified" },
        depositors: { $sum: "$depositors" },
        revenue: { $sum: "$totalCost" },
      },
    },
  ]);
  const convBySite = new Map(convAgg.map((c) => [String(c._id), c]));

  const clicksBySite = new Map<string, number>();
  for (const link of links) {
    const c = clicksByLink.get(String(link._id)) || 0;
    clicksBySite.set(String(link.siteId), (clicksBySite.get(String(link.siteId)) || 0) + c);
  }

  const siteRows = sites.map((s) => {
    const conv = convBySite.get(String(s._id));
    return {
      id: String(s._id),
      name: s.name,
      url: s.url ?? null,
      color: s.colorAccent,
      clicks: clicksBySite.get(String(s._id)) || 0,
      conversions: ((conv?.qualified as number) || 0) + ((conv?.depositors as number) || 0),
      revenue: (conv?.revenue as number) || 0,
    };
  });

  const siteById = new Map(sites.map((s) => [String(s._id), s]));

  const linkRows = links.map((l) => {
    const site = siteById.get(String(l.siteId));
    const offer = offerMap.get(String(l.offerId));
    const url =
      l.linkMode === "CONVERTED"
        ? l.ourTrackingUrl || ""
        : l.advertiserUrl;
    return {
      id: String(l._id),
      offerName: offer?.name ?? "Offer",
      siteName: site?.name ?? "Site",
      siteColor: site?.colorAccent ?? "#9CA3AF",
      linkMode: l.linkMode,
      url,
      clicks: l.linkMode === "CONVERTED" ? clicksByLink.get(String(l._id)) || 0 : 0,
    };
  });

  return {
    publisherName: publisher?.name ?? "Publisher",
    totalClicks: siteRows.reduce((s, r) => s + r.clicks, 0),
    totalConversions: siteRows.reduce((s, r) => s + r.conversions, 0),
    totalRevenue: siteRows.reduce((s, r) => s + r.revenue, 0),
    sites: siteRows,
    links: linkRows,
  };
}
