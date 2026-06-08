import { notFound } from "next/navigation";
import { dbConnect } from "@/lib/db";
import {
  Publisher,
  User,
  MediaSite,
  Offer,
  OfferAssignment,
  TrackingLink,
  Click,
  Conversion,
} from "@/models";
import { getReportData } from "@/lib/reporting";
import { publisherFacingUrl } from "@/lib/tracking";
import { PublisherDetail } from "@/components/admin/PublisherDetail";
import type { LinkCombo } from "@/components/admin/TrackingLinkConfig";

export const dynamic = "force-dynamic";

export default async function PublisherDetailPage({ params }: { params: { id: string } }) {
  await dbConnect();
  const publisher = await Publisher.findById(params.id).lean();
  if (!publisher) notFound();

  const [user, sites, assignments, allOffers] = await Promise.all([
    User.findById(publisher.userId).lean(),
    MediaSite.find({ publisherId: publisher._id }).sort({ createdAt: 1 }).lean(),
    OfferAssignment.find({ publisherId: publisher._id }).lean(),
    Offer.find().lean(),
  ]);

  const siteIds = sites.map((s) => s._id);
  const links = await TrackingLink.find({ siteId: { $in: siteIds } }).lean();
  const linkIds = links.map((l) => l._id);

  const [clickAgg, convAgg] = await Promise.all([
    Click.aggregate([
      { $match: { trackingLinkId: { $in: linkIds } } },
      { $group: { _id: "$trackingLinkId", count: { $sum: 1 } } },
    ]),
    Conversion.aggregate([
      { $match: { siteId: { $in: siteIds } } },
      {
        $group: {
          _id: "$siteId",
          qualified: { $sum: "$qualified" },
          depositors: { $sum: "$depositors" },
          revenue: { $sum: "$totalCost" },
        },
      },
    ]),
  ]);
  const clicksByLink = new Map(clickAgg.map((c) => [String(c._id), c.count]));
  const convBySite = new Map(convAgg.map((c) => [String(c._id), c]));

  const clicksBySite = new Map<string, number>();
  for (const l of links) {
    const c = clicksByLink.get(String(l._id)) || 0;
    clicksBySite.set(String(l.siteId), (clicksBySite.get(String(l.siteId)) || 0) + c);
  }

  const offerMap = new Map(allOffers.map((o) => [String(o._id), o]));
  const assignedOfferIds = assignments.map((a) => String(a.offerId));

  const siteCards = sites.map((s) => {
    const conv = convBySite.get(String(s._id)) as
      | { qualified: number; depositors: number; revenue: number }
      | undefined;
    return {
      id: String(s._id),
      name: s.name,
      url: s.url ?? null,
      color: s.colorAccent,
      clicks: clicksBySite.get(String(s._id)) || 0,
      conversions: (conv?.qualified || 0) + (conv?.depositors || 0),
      revenue: conv?.revenue || 0,
    };
  });

  const assignedOffers = assignedOfferIds
    .map((id) => offerMap.get(id))
    .filter(Boolean)
    .map((o) => ({
      id: String(o!._id),
      name: o!.name,
      type: o!.type,
      payoutValue: o!.payoutValue,
      currency: o!.payoutCurrency,
    }));

  const availableOffers = allOffers
    .filter((o) => o.isActive && !assignedOfferIds.includes(String(o._id)))
    .map((o) => ({ id: String(o._id), name: o.name }));

  // Build offer × site combos for the tracking links tab
  const linkByCombo = new Map(links.map((l) => [`${String(l.offerId)}:${String(l.siteId)}`, l]));
  const combos: LinkCombo[] = [];
  for (const offer of assignedOffers) {
    for (const site of siteCards) {
      const existing = linkByCombo.get(`${offer.id}:${site.id}`);
      combos.push({
        offerId: offer.id,
        offerName: offer.name,
        siteId: site.id,
        siteName: site.name,
        siteColor: site.color,
        link: existing
          ? {
              id: String(existing._id),
              linkMode: existing.linkMode as "DIRECT" | "CONVERTED",
              advertiserUrl: existing.advertiserUrl,
              publisherUrl: publisherFacingUrl(existing),
              clicks: clicksByLink.get(String(existing._id)) || 0,
            }
          : null,
      });
    }
  }

  const performance = await getReportData({ publisherId: params.id });

  return (
    <PublisherDetail
      publisher={{
        id: String(publisher._id),
        name: publisher.name,
        email: user?.email ?? "",
      }}
      sites={siteCards}
      assignedOffers={assignedOffers}
      availableOffers={availableOffers}
      combos={combos}
      performance={performance}
    />
  );
}
