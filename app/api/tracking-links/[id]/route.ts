import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { TrackingLink } from "@/models";
import { requireAdmin, handleApiError } from "@/lib/api-auth";
import { z } from "zod";

// Link mode is locked after creation — only the destination URL / UTMs can change.
const schema = z.object({
  advertiserUrl: z.string().url().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await dbConnect();
    const body = schema.parse(await req.json());
    const link = await TrackingLink.findByIdAndUpdate(params.id, body, { new: true }).lean();
    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...link, _id: String(link._id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await dbConnect();
    await TrackingLink.findByIdAndDelete(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
