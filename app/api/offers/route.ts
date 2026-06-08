import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Offer, OfferAssignment } from "@/models";
import { requireAdmin, getSessionOrThrow, handleApiError } from "@/lib/api-auth";
import { z } from "zod";

const offerSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["CPA", "CPI", "CPL", "REVSHARE"]),
  payoutValue: z.coerce.number().min(0),
  payoutCurrency: z.string().min(1).default("USD"),
  appsflyerAppId: z.string().min(1),
  advertiserEmail: z.string().email().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    await getSessionOrThrow();
    await dbConnect();
    const offers = await Offer.find().sort({ createdAt: -1 }).lean();
    const counts = await OfferAssignment.aggregate([
      { $group: { _id: "$offerId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    return NextResponse.json(
      offers.map((o) => ({ ...o, _id: String(o._id), assignedCount: countMap.get(String(o._id)) || 0 }))
    );
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await dbConnect();
    const body = offerSchema.parse(await req.json());
    const offer = await Offer.create({
      ...body,
      advertiserEmail: body.advertiserEmail || undefined,
    });
    return NextResponse.json({ ...offer.toObject(), _id: String(offer._id) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
