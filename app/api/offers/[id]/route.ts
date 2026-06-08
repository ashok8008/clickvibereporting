import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Offer } from "@/models";
import { requireAdmin, handleApiError } from "@/lib/api-auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["CPA", "CPI", "CPL", "REVSHARE"]).optional(),
  payoutValue: z.coerce.number().min(0).optional(),
  payoutCurrency: z.string().min(1).optional(),
  appsflyerAppId: z.string().min(1).optional(),
  advertiserEmail: z.string().email().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await dbConnect();
    const body = updateSchema.parse(await req.json());
    const offer = await Offer.findByIdAndUpdate(params.id, body, { new: true }).lean();
    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    return NextResponse.json({ ...offer, _id: String(offer._id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await dbConnect();
    await Offer.findByIdAndDelete(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
