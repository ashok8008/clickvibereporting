import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import {
  Publisher,
  User,
  MediaSite,
  OfferAssignment,
  TrackingLink,
} from "@/models";
import { requireAdmin, handleApiError } from "@/lib/api-auth";
import { z } from "zod";

const updateSchema = z.object({ name: z.string().min(1) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await dbConnect();
    const body = updateSchema.parse(await req.json());
    const pub = await Publisher.findByIdAndUpdate(params.id, { name: body.name }, { new: true });
    if (!pub) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await User.findByIdAndUpdate(pub.userId, { name: body.name });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await dbConnect();
    const pub = await Publisher.findById(params.id);
    if (!pub) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const sites = await MediaSite.find({ publisherId: pub._id });
    const siteIds = sites.map((s) => s._id);
    await TrackingLink.deleteMany({ siteId: { $in: siteIds } });
    await MediaSite.deleteMany({ publisherId: pub._id });
    await OfferAssignment.deleteMany({ publisherId: pub._id });
    await User.findByIdAndDelete(pub.userId);
    await pub.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
