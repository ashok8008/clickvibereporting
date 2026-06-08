import { dbConnect } from "./db";
import { Offer, Conversion, AppsflyerSync, MediaSite, ConversionSource } from "@/models";

export interface SyncResult {
  offerId: string;
  offerName: string;
  status: "success" | "error";
  recordCount: number;
  reportDate?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

export function yesterdayRange(): {
  from: string;
  to: string;
  startOfYesterday: Date;
  endOfYesterday: Date;
} {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const date = yesterday.toISOString().split("T")[0];

  const startOfYesterday = new Date(yesterday);
  startOfYesterday.setHours(0, 0, 0, 0);
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  return { from: date, to: date, startOfYesterday, endOfYesterday };
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isQuotaError(message: string): boolean {
  return /maximum number of install reports|rate limit|quota/i.test(message);
}

async function findExistingSync(
  offerId: unknown,
  reportDate: string
): Promise<{ status: string; recordCount: number; error?: string; reason: string } | null> {
  const success = await AppsflyerSync.findOne({
    offerId,
    reportDate,
    status: "success",
  }).lean();
  if (success) {
    return {
      status: "success",
      recordCount: success.recordCount,
      reason: "already synced",
    };
  }

  const quotaHit = await AppsflyerSync.findOne({
    offerId,
    reportDate,
    error: /maximum number of install reports/i,
  }).lean();
  if (quotaHit) {
    return {
      status: "error",
      recordCount: 0,
      error: quotaHit.error,
      reason: "quota exceeded",
    };
  }

  // One API attempt per offer per report date per calendar day.
  const attemptedToday = await AppsflyerSync.findOne({
    offerId,
    reportDate,
    syncedAt: { $gte: startOfToday() },
  }).lean();
  if (attemptedToday) {
    return {
      status: attemptedToday.status,
      recordCount: attemptedToday.recordCount,
      error: attemptedToday.error,
      reason: attemptedToday.status === "error" ? "already attempted today" : "already synced",
    };
  }

  // Legacy rows (before reportDate field was added).
  const legacyToday = await AppsflyerSync.findOne({
    offerId,
    reportDate: { $exists: false },
    syncedAt: { $gte: startOfToday() },
  })
    .sort({ syncedAt: -1 })
    .lean();
  if (legacyToday) {
    if (legacyToday.status === "success") {
      return {
        status: "success",
        recordCount: legacyToday.recordCount,
        reason: "already synced",
      };
    }
    if (legacyToday.error && isQuotaError(legacyToday.error)) {
      return {
        status: "error",
        recordCount: 0,
        error: legacyToday.error,
        reason: "quota exceeded",
      };
    }
    return {
      status: legacyToday.status,
      recordCount: legacyToday.recordCount,
      error: legacyToday.error,
      reason: "already attempted today",
    };
  }

  return null;
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

  const existing = await findExistingSync(offer._id, from);
  if (existing) {
    console.log("[appsflyer] skipping sync", {
      offerId: String(offer._id),
      offerName: offer.name,
      reportDate: from,
      reason: existing.reason,
    });
    return {
      offerId: String(offer._id),
      offerName: offer.name,
      status: existing.status === "success" ? "success" : "error",
      recordCount: existing.recordCount,
      reportDate: from,
      error: existing.error,
      skipped: true,
      reason: existing.reason,
    };
  }

  try {
    if (!token) {
      await AppsflyerSync.create({
        offerId: offer._id,
        reportDate: from,
        status: "error",
        recordCount: 0,
        error: "APPSFLYER_API_TOKEN not configured",
      });
      return {
        offerId: String(offer._id),
        offerName: offer.name,
        status: "error",
        recordCount: 0,
        reportDate: from,
        error: "APPSFLYER_API_TOKEN not configured",
      };
    }

    const url = `https://hq1.appsflyer.com/api/raw-data/export/app/${offer.appsflyerAppId}/installs_report/v5?from=${from}&to=${to}&timezone=UTC`;

    console.log("[appsflyer] fetching installs", {
      offerId: String(offer._id),
      offerName: offer.name,
      reportDate: from,
      appId: offer.appsflyerAppId,
    });

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "text/csv" },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`AppsFlyer API returned ${res.status}: ${body}`);
    }

    const csv = await res.text();
    const lines = csv.trim().split("\n");
    const recordCount = Math.max(0, lines.length - 1); // minus header

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
      reportDate: from,
      status: "success",
      recordCount,
    });

    console.log("[appsflyer] sync success", {
      offerId: String(offer._id),
      reportDate: from,
      recordCount,
    });

    return {
      offerId: String(offer._id),
      offerName: offer.name,
      status: "success",
      recordCount,
      reportDate: from,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[appsflyer] sync failed", {
      offerId: String(offer._id),
      reportDate: from,
      error: message,
      quota: isQuotaError(message),
    });
    await AppsflyerSync.create({
      offerId: offer._id,
      reportDate: from,
      status: "error",
      recordCount: 0,
      error: message,
    });
    return {
      offerId: String(offer._id),
      offerName: offer.name,
      status: "error",
      recordCount: 0,
      reportDate: from,
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
