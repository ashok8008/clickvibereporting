/**
 * ClickVibe seed script.
 *
 * Run with: npm run seed
 * Requires a running MongoDB at DATABASE_URL (see .env.local).
 */
import bcrypt from "bcryptjs";
import { dbConnect } from "../lib/db";
import { buildOurTrackingUrl } from "../lib/tracking";
import { getDateRangeForPreset } from "../lib/date-ranges";
import {
  mongoose,
  User,
  Publisher,
  MediaSite,
  Offer,
  OfferAssignment,
  TrackingLink,
  Conversion,
  Click,
  Role,
  OfferType,
  LinkMode,
  ConversionSource,
} from "../models";

const SITES: { name: string; color: string }[] = [
  { name: "VICE", color: "#6366F1" },
  { name: "POPCULTURE", color: "#EC4899" },
  { name: "TFM", color: "#F59E0B" },
  { name: "SUGGEST", color: "#10B981" },
  { name: "RARE", color: "#3B82F6" },
  { name: "WIDEOPEN", color: "#EF4444" },
  { name: "TFMGIRLS", color: "#8B5CF6" },
];

// Sample CSV rows (Polymarket dashboard export style)
const SAMPLE_CONVERSIONS = [
  { promoCode: "POPCULTURE", signups: 5, depositors: 4, traders: 4, qualified: 4, cpa: 80, cost: 320 },
  { promoCode: "VICE", signups: 2, depositors: 1, traders: 1, qualified: 1, cpa: 80, cost: 80 },
  { promoCode: "TFMGIRLS", signups: 1, depositors: 1, traders: 1, qualified: 1, cpa: 80, cost: 80 },
  { promoCode: "SUGGEST", signups: 3, depositors: 2, traders: 2, qualified: 2, cpa: 80, cost: 160 },
  { promoCode: "CLICKVIBE1", signups: 0, depositors: 1, traders: 1, qualified: 1, cpa: 80, cost: 80 },
];

async function main() {
  await dbConnect();
  console.log("Connected. Clearing existing data…");

  await Promise.all([
    User.deleteMany({}),
    Publisher.deleteMany({}),
    MediaSite.deleteMany({}),
    Offer.deleteMany({}),
    OfferAssignment.deleteMany({}),
    TrackingLink.deleteMany({}),
    Conversion.deleteMany({}),
    Click.deleteMany({}),
  ]);

  // 1. Admin
  const admin = await User.create({
    email: "admin@clickvibe.ai",
    password: await bcrypt.hash("June@123", 10),
    role: Role.ADMIN,
    name: "ClickVibe Admin",
  });
  console.log("Admin:", admin.email);

  // 2. Polymarket offer
  const offer = await Offer.create({
    name: "Polymarket iOS",
    type: OfferType.CPA,
    payoutValue: 80,
    payoutCurrency: "USD",
    appsflyerAppId: "id6648798962",
    advertiserEmail: "legate@polymarket.com",
    isActive: true,
  });
  console.log("Offer:", offer.name);

  // 3. Publisher Savage.Ventures + user
  const pubUser = await User.create({
    email: "alex@clickvibe.ai",
    password: await bcrypt.hash("Alex@123", 10),
    role: Role.PUBLISHER,
    name: "Savage.Ventures",
  });
  const publisher = await Publisher.create({ name: "Savage.Ventures", userId: pubUser._id });
  console.log("Publisher:", publisher.name, "(", pubUser.email, ")");

  // 4. Sites with assigned colors
  const sites = [];
  for (const s of SITES) {
    const site = await MediaSite.create({
      name: s.name,
      colorAccent: s.color,
      publisherId: publisher._id,
    });
    sites.push(site);
  }
  console.log("Sites:", sites.map((s) => s.name).join(", "));

  // 5. Assign offer to publisher
  await OfferAssignment.create({ offerId: offer._id, publisherId: publisher._id });

  // 6. DIRECT tracking links per site
  for (const site of sites) {
    await TrackingLink.create({
      offerId: offer._id,
      siteId: site._id,
      linkMode: LinkMode.DIRECT,
      advertiserUrl: `https://polymarket-app.onelink.me/S8ac/${site.name}`,
    });
  }

  // One CONVERTED link example (VICE) to demo our redirect + clicks
  const viceSite = sites.find((s) => s.name === "VICE")!;
  const convertedLink = await TrackingLink.create({
    offerId: offer._id,
    siteId: viceSite._id,
    linkMode: LinkMode.CONVERTED,
    advertiserUrl: `https://polymarket-app.onelink.me/S8ac/VICE-converted`,
  });
  convertedLink.ourTrackingUrl = buildOurTrackingUrl(String(convertedLink._id));
  await convertedLink.save();
  console.log("Tracking links created. CONVERTED demo:", convertedLink.ourTrackingUrl);

  // 7. Sample conversions (CSV_UPLOAD)
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 6);
  periodStart.setHours(0, 0, 0, 0);
  const periodEnd = new Date();
  periodEnd.setHours(23, 59, 59, 999);

  const siteByName = new Map(sites.map((s) => [s.name.toUpperCase(), s]));
  for (const row of SAMPLE_CONVERSIONS) {
    const site = siteByName.get(row.promoCode.toUpperCase());
    await Conversion.create({
      offerId: offer._id,
      siteId: site?._id ?? null,
      promoCode: row.promoCode,
      signups: row.signups,
      depositors: row.depositors,
      traders: row.traders,
      qualified: row.qualified,
      cpaPayout: row.cpa,
      totalCost: row.cost,
      source: ConversionSource.CSV_UPLOAD,
      periodStart,
      periodEnd,
    });
  }
  console.log("Sample conversions imported:", SAMPLE_CONVERSIONS.length);

  // 8. Sample clicks within the Last 7 Days range (for conversion rate KPI)
  const allLinks = await TrackingLink.find().lean();
  const matchedQualified = SAMPLE_CONVERSIONS.filter((row) =>
    siteByName.get(row.promoCode.toUpperCase())
  ).reduce((s, r) => s + r.qualified, 0);
  const clickRange = getDateRangeForPreset("last7");
  const clickRangeStart = new Date(`${clickRange.from}T00:00:00`);
  const targetClicks = matchedQualified * 10; // 10% qualified-to-click rate
  for (let i = 0; i < targetClicks; i++) {
    const link = allLinks[i % allLinks.length];
    const clickedAt = new Date(clickRangeStart);
    clickedAt.setDate(clickRangeStart.getDate() + (i % 7));
    clickedAt.setHours(9 + (i % 10), i % 60, 0, 0);
    await Click.create({ trackingLinkId: link._id, clickedAt });
  }
  console.log("Sample clicks created:", targetClicks);

  await mongoose.disconnect();
  console.log("\n✅ Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
