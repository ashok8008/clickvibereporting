import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/api-auth";
import { sendPublisherCredentials } from "@/lib/email";
import { appBaseUrl } from "@/lib/tracking";
import { z } from "zod";

const schema = z.object({
  to: z.string().email(),
  publisherName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = schema.parse(await req.json());
    const loginUrl = `${appBaseUrl()}/login`;

    console.log("[send-credentials] request", {
      adminEmail: session.user.email,
      to: body.to,
      publisherName: body.publisherName,
      loginEmail: body.email,
      loginUrl,
    });

    const result = await sendPublisherCredentials({
      to: body.to,
      publisherName: body.publisherName,
      email: body.email,
      password: body.password,
      loginUrl,
    });

    console.log("[send-credentials] result", {
      to: body.to,
      sent: result.sent,
      messageId: result.messageId,
      error: result.error,
    });

    if (!result.sent && !result.error?.includes("not configured")) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[send-credentials] failed", {
      error: err instanceof Error ? err.message : err,
    });
    return handleApiError(err);
  }
}
