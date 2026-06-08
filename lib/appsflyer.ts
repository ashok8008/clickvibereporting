import { dbConnect } from "./db";
import { Offer, Conversion, AppsflyerSync, MediaSite, ConversionSource } from "@/models";

interface SyncResult {
  offerId: string;
  offerName: string;
  status: "success" | "error";
  recordCount: number;
  error?: string;
}

function yesterdayRange(): { from: string; to: string } {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  const day = d.toISOString().slice(0, 10);
  return { from: day, to: day };
}

/**
 * Pull yesterday's installs for a single offer from the AppsFlyer Pull API and
 * persist them as Conversion records (source=APPSFLYER). Logs an AppsflyerSync row.
 *
 * If APPSFLYER_API_TOKEN is missing we record a no-op sync so the UI/cron still works.
 */
async function syncOffer(offer: {
  _id: unknown;
  name: string;
  appsflyerAppId: string;
}): Promise<SyncResult> {
  const token = process.env.APPSFLYER_API_TOKEN;
  const { from, to } = yesterdayRange();

  try {
    if (!token) {
      await AppsflyerSync.create({
        offerId: offer._id,
        status: "error",
        recordCount: 0,
        error: "APPSFLYER_API_TOKEN not configured",
      });
      return {
        offerId: String(offer._id),
        offerName: offer.name,
        status: "error",
        recordCount: 0,
        error: "APPSFLYER_API_TOKEN not configured",
      };
    }

    const url = `https://hq1.appsflyer.com/api/raw-data/export/app/${offer.appsflyerAppId}/installs_report/v5?from=${from}&to=${to}&timezone=UTC`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "text/csv" },
    });

    if (!res.ok) {
      throw new Error(`AppsFlyer API returned ${res.status}: ${await res.text()}`);
    }

    const csv = await res.text();
    const lines = csv.trim().split("\n");
    const recordCount = Math.max(0, lines.length - 1); // minus header

    // Attribution mapping (media source / sub param → MediaSite) is best-effort.
    // Persist an aggregate APPSFLYER conversion row capturing the install count.
    const sites = await MediaSite.find().lean();
    const header = lines[0]?.toLowerCase().split(",") ?? [];
    const mediaSourceIdx = header.findIndex((h) => h.includes("media_source") || h.includes("campaign"));

    const byCode: Record<string, number> = {};
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const key = mediaSourceIdx >= 0 ? (cols[mediaSourceIdx] || "").trim() : "";
      byCode[key] = (byCode[key] || 0) + 1;
    }

    const periodStart = new Date(`${from}T00:00:00.000Z`);
    const periodEnd = new Date(`${to}T23:59:59.999Z`);

    for (const [code, count] of Object.entries(byCode)) {
      const site = sites.find((s) => s.name.toLowerCase() === code.toLowerCase());
      await Conversion.create({
        offerId: offer._id,
        siteId: site?._id ?? null,
        promoCode: code || undefined,
        signups: count,
        source: ConversionSource.APPSFLYER,
        periodStart,
        periodEnd,
      });
    }

    await AppsflyerSync.create({
      offerId: offer._id,
      status: "success",
      recordCount,
    });

    return {
      offerId: String(offer._id),
      offerName: offer.name,
      status: "success",
      recordCount,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await AppsflyerSync.create({
      offerId: offer._id,
      status: "error",
      recordCount: 0,
      error: message,
    });
    return {
      offerId: String(offer._id),
      offerName: offer.name,
      status: "error",
      recordCount: 0,
      error: message,
    };
  }
}

/** Sync all active offers. Called by the cron route and the manual trigger. */
export async function runAppsflyerSync(): Promise<SyncResult[]> {
  await dbConnect();
  const offers = await Offer.find({ isActive: true }).lean();
  const results: SyncResult[] = [];
  for (const offer of offers) {
    results.push(
      await syncOffer({ _id: offer._id, name: offer.name, appsflyerAppId: offer.appsflyerAppId })
    );
  }
  return results;
}
