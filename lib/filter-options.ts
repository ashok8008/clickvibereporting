import { dbConnect } from "./db";
import { Offer, Publisher, MediaSite } from "@/models";

export interface FilterOptions {
  offers: { id: string; name: string }[];
  publishers: { id: string; name: string }[];
  sites: { id: string; name: string; publisherId: string }[];
}

export async function getFilterOptions(publisherId?: string): Promise<FilterOptions> {
  await dbConnect();
  const [offers, publishers, sites] = await Promise.all([
    Offer.find().sort({ name: 1 }).lean(),
    publisherId ? Publisher.find({ _id: publisherId }).lean() : Publisher.find().sort({ name: 1 }).lean(),
    publisherId ? MediaSite.find({ publisherId }).lean() : MediaSite.find().sort({ name: 1 }).lean(),
  ]);

  return {
    offers: offers.map((o) => ({ id: String(o._id), name: o.name })),
    publishers: publishers.map((p) => ({ id: String(p._id), name: p.name })),
    sites: sites.map((s) => ({ id: String(s._id), name: s.name, publisherId: String(s.publisherId) })),
  };
}
