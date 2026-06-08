import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { MediaSite, TrackingLink } from "@/models";
import { requireAdmin, handleApiError } from "@/lib/api-auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().optional(),
  colorAccent: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await dbConnect();
    const body = schema.parse(await req.json());
    const site = await MediaSite.findByIdAndUpdate(params.id, body, { new: true }).lean();
    if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...site, _id: String(site._id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await dbConnect();
    await TrackingLink.deleteMany({ siteId: params.id });
    await MediaSite.findByIdAndDelete(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
