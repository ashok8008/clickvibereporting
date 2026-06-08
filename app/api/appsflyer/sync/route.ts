import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runAppsflyerSync } from "@/lib/appsflyer";
import { handleApiError } from "@/lib/api-auth";

// Triggered by Vercel Cron (with CRON_SECRET) OR manually by an admin from the UI.
async function authorize(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  const session = await getServerSession(authOptions);
  return session?.user.role === "ADMIN";
}

export async function POST(req: NextRequest) {
  try {
    if (!(await authorize(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const results = await runAppsflyerSync();
    return NextResponse.json({ results });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
