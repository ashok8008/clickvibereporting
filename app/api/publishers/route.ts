import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { User, Publisher, MediaSite, OfferAssignment, Role } from "@/models";
import { requireAdmin, handleApiError, ApiError } from "@/lib/api-auth";
import { nextSiteColor } from "@/lib/color-palette";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  sites: z
    .array(z.object({ name: z.string().min(1), url: z.string().optional() }))
    .default([]),
});

export async function GET() {
  try {
    await requireAdmin();
    await dbConnect();
    const publishers = await Publisher.find().sort({ createdAt: -1 }).lean();
    const userIds = publishers.map((p) => p.userId);
    const [users, siteCounts, assignCounts] = await Promise.all([
      User.find({ _id: { $in: userIds } }).lean(),
      MediaSite.aggregate([{ $group: { _id: "$publisherId", count: { $sum: 1 } } }]),
      OfferAssignment.aggregate([{ $group: { _id: "$publisherId", count: { $sum: 1 } } }]),
    ]);
    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const siteMap = new Map(siteCounts.map((s) => [String(s._id), s.count]));
    const assignMap = new Map(assignCounts.map((a) => [String(a._id), a.count]));

    return NextResponse.json(
      publishers.map((p) => ({
        _id: String(p._id),
        name: p.name,
        email: userMap.get(String(p.userId))?.email ?? "",
        siteCount: siteMap.get(String(p._id)) || 0,
        offerCount: assignMap.get(String(p._id)) || 0,
        createdAt: p.createdAt,
      }))
    );
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await dbConnect();
    const body = createSchema.parse(await req.json());

    const existing = await User.findOne({ email: body.email.toLowerCase() });
    if (existing) throw new ApiError(400, "A user with that email already exists");

    const hashed = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      email: body.email.toLowerCase(),
      password: hashed,
      role: Role.PUBLISHER,
      name: body.name,
    });

    const publisher = await Publisher.create({ name: body.name, userId: user._id });

    const totalSites = await MediaSite.countDocuments();
    let colorIndex = totalSites;
    for (const site of body.sites) {
      await MediaSite.create({
        name: site.name,
        url: site.url || undefined,
        colorAccent: nextSiteColor(colorIndex),
        publisherId: publisher._id,
      });
      colorIndex += 1;
    }

    return NextResponse.json({ _id: String(publisher._id) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
