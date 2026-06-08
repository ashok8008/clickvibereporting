import { dbConnect } from "@/lib/db";
import { Offer, OfferAssignment } from "@/models";
import { OffersClient, type OfferRow } from "@/components/admin/OffersClient";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  await dbConnect();
  const offers = await Offer.find().sort({ createdAt: -1 }).lean();
  const counts = await OfferAssignment.aggregate([
    { $group: { _id: "$offerId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const rows: OfferRow[] = offers.map((o) => ({
    _id: String(o._id),
    name: o.name,
    type: o.type,
    payoutValue: o.payoutValue,
    payoutCurrency: o.payoutCurrency,
    appsflyerAppId: o.appsflyerAppId,
    advertiserEmail: o.advertiserEmail,
    isActive: o.isActive,
    assignedCount: countMap.get(String(o._id)) || 0,
    createdAt: new Date(o.createdAt).toISOString(),
  }));

  return <OffersClient initialOffers={rows} />;
}
