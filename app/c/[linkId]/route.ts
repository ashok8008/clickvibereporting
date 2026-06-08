import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { TrackingLink, Click, Offer } from "@/models";
import { trackingBaseUrl } from "@/lib/tracking";

export const dynamic = "force-dynamic";

// Click redirect handler for CONVERTED tracking links.
export async function GET(req: NextRequest, { params }: { params: { linkId: string } }) {
  const fallback = trackingBaseUrl();

  try {
    await dbConnect();

    const link = await TrackingLink.findById(params.linkId).lean();
    if (!link) return NextResponse.redirect(fallback, 302);

    const offer = await Offer.findById(link.offerId).lean();
    if (!offer || !offer.isActive) return NextResponse.redirect(fallback, 302);

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      undefined;

    await Click.create({
      trackingLinkId: link._id,
      ip,
      userAgent: req.headers.get("user-agent") || undefined,
      country: req.headers.get("cf-ipcountry") || undefined,
    });

    return NextResponse.redirect(link.advertiserUrl, 302);
  } catch (err) {
    console.error("[click-redirect] error:", err);
    return NextResponse.redirect(fallback, 302);
  }
}
