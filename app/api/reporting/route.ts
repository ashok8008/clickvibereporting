import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, handleApiError, ApiError } from "@/lib/api-auth";
import { getReportData } from "@/lib/reporting";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const { searchParams } = new URL(req.url);

    const filters = {
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      offerId: searchParams.get("offerId") || undefined,
      publisherId: searchParams.get("publisherId") || undefined,
      siteId: searchParams.get("siteId") || undefined,
      source: searchParams.get("source") || undefined,
    };

    // Publishers can only ever see their own scope.
    if (session.user.role === "PUBLISHER") {
      if (!session.user.publisherId) throw new ApiError(403, "No publisher profile");
      filters.publisherId = session.user.publisherId;
    }

    const data = await getReportData(filters);
    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err);
  }
}
