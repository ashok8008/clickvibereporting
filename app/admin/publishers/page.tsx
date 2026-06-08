import { dbConnect } from "@/lib/db";
import { Publisher, User, MediaSite, OfferAssignment } from "@/models";
import { PublishersClient, type PublisherRow } from "@/components/admin/PublishersClient";

export const dynamic = "force-dynamic";

export default async function PublishersPage() {
  await dbConnect();
  const publishers = await Publisher.find().sort({ createdAt: -1 }).lean();
  const [users, siteCounts, assignCounts] = await Promise.all([
    User.find({ _id: { $in: publishers.map((p) => p.userId) } }).lean(),
    MediaSite.aggregate([{ $group: { _id: "$publisherId", count: { $sum: 1 } } }]),
    OfferAssignment.aggregate([{ $group: { _id: "$publisherId", count: { $sum: 1 } } }]),
  ]);
  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const siteMap = new Map(siteCounts.map((s) => [String(s._id), s.count]));
  const assignMap = new Map(assignCounts.map((a) => [String(a._id), a.count]));

  const rows: PublisherRow[] = publishers.map((p) => ({
    _id: String(p._id),
    name: p.name,
    email: userMap.get(String(p.userId))?.email ?? "",
    siteCount: siteMap.get(String(p._id)) || 0,
    offerCount: assignMap.get(String(p._id)) || 0,
    createdAt: new Date(p.createdAt).toISOString(),
  }));

  return <PublishersClient initialPublishers={rows} />;
}
