import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { TrackingLink } from "@/models";
import { requireAdmin, handleApiError } from "@/lib/api-auth";
import { buildOurTrackingUrl } from "@/lib/tracking";
import { z } from "zod";

const schema = z.object({
  offerId: z.string().min(1),
  siteId: z.string().min(1),
  linkMode: z.enum(["DIRECT", "CONVERTED"]),
  advertiserUrl: z.string().url(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
});

// Create a tracking link for an offer × site. Generates ourTrackingUrl when CONVERTED.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await dbConnect();
    const body = schema.parse(await req.json());

    const link = await TrackingLink.create({
      offerId: body.offerId,
      siteId: body.siteId,
      linkMode: body.linkMode,
      advertiserUrl: body.advertiserUrl,
      utmSource: body.utmSource || undefined,
      utmMedium: body.utmMedium || undefined,
    });

    if (body.linkMode === "CONVERTED") {
      link.ourTrackingUrl = buildOurTrackingUrl(String(link._id));
      await link.save();
    }

    return NextResponse.json({ ...link.toObject(), _id: String(link._id) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
