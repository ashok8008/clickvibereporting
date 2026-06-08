import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { MediaSite, Conversion, ConversionSource } from "@/models";
import { requireAdmin, handleApiError } from "@/lib/api-auth";
import { parseConversionCsv } from "@/lib/csv-parser";
import { z } from "zod";

const parseSchema = z.object({
  action: z.literal("parse"),
  content: z.string().min(1),
  offerId: z.string().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
});

const confirmRowSchema = z.object({
  promoCode: z.string(),
  siteId: z.string().nullable(),
  signups: z.number(),
  depositors: z.number(),
  traders: z.number(),
  qualified: z.number(),
  cpa: z.number(),
  cost: z.number(),
  raw: z.record(z.string()).optional(),
});

const confirmSchema = z.object({
  action: z.literal("confirm"),
  offerId: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  duplicateStrategy: z.enum(["overwrite", "skip"]).default("skip"),
  rows: z.array(confirmRowSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await dbConnect();
    const body = await req.json();

    if (body.action === "parse") {
      const { content } = parseSchema.parse(body);
      const parsed = parseConversionCsv(content);
      const sites = await MediaSite.find().lean();

      const rows = parsed.map((r) => {
        const site = sites.find(
          (s) => s.name.toLowerCase().trim() === r.promoCode.toLowerCase().trim()
        );
        return {
          promoCode: r.promoCode,
          siteId: site ? String(site._id) : null,
          siteName: site?.name ?? null,
          siteColor: site?.colorAccent ?? null,
          matched: !!site,
          signups: r.signups,
          depositors: r.depositors,
          signupToDepPct: r.signupToDepPct,
          traders: r.traders,
          qualified: r.qualified,
          signupToQualPct: r.signupToQualPct,
          cpa: r.cpa,
          cost: r.cost,
          raw: r.raw,
        };
      });

      return NextResponse.json({ rows });
    }

    if (body.action === "confirm") {
      const data = confirmSchema.parse(body);
      const periodStart = new Date(data.periodStart);
      const periodEnd = new Date(data.periodEnd);
      periodEnd.setHours(23, 59, 59, 999);

      let imported = 0;
      let skipped = 0;
      let overwritten = 0;

      for (const row of data.rows) {
        const dupQuery = {
          offerId: data.offerId,
          promoCode: row.promoCode,
          periodStart,
          periodEnd,
        };
        const existing = await Conversion.findOne(dupQuery);

        if (existing) {
          if (data.duplicateStrategy === "skip") {
            skipped += 1;
            continue;
          }
          await Conversion.deleteMany(dupQuery);
          overwritten += 1;
        }

        await Conversion.create({
          offerId: data.offerId,
          siteId: row.siteId || null,
          promoCode: row.promoCode || undefined,
          signups: row.signups,
          depositors: row.depositors,
          traders: row.traders,
          qualified: row.qualified,
          cpaPayout: row.cpa,
          totalCost: row.cost,
          source: ConversionSource.CSV_UPLOAD,
          periodStart,
          periodEnd,
          rawRow: row.raw,
        });
        imported += 1;
      }

      return NextResponse.json({ imported, skipped, overwritten });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return handleApiError(err);
  }
}
