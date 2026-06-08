import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { MediaSite } from "@/models";
import { requireAdmin, handleApiError } from "@/lib/api-auth";
import { nextSiteColor } from "@/lib/color-palette";
import { z } from "zod";

const schema = z.object({
  publisherId: z.string().min(1),
  name: z.string().min(1),
  url: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await dbConnect();
    const body = schema.parse(await req.json());
    const total = await MediaSite.countDocuments();
    const site = await MediaSite.create({
      name: body.name,
      url: body.url || undefined,
      colorAccent: nextSiteColor(total),
      publisherId: body.publisherId,
    });
    return NextResponse.json({ ...site.toObject(), _id: String(site._id) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
