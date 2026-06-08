import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { OfferAssignment } from "@/models";
import { requireAdmin, handleApiError } from "@/lib/api-auth";
import { z } from "zod";

const schema = z.object({
  offerId: z.string().min(1),
  publisherId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await dbConnect();
    const body = schema.parse(await req.json());
    const existing = await OfferAssignment.findOne(body);
    if (existing) return NextResponse.json({ _id: String(existing._id) });
    const assignment = await OfferAssignment.create(body);
    return NextResponse.json({ _id: String(assignment._id) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const offerId = searchParams.get("offerId");
    const publisherId = searchParams.get("publisherId");
    if (!offerId || !publisherId)
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    await OfferAssignment.deleteOne({ offerId, publisherId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
