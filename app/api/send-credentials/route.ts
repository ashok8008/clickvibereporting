import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/api-auth";
import { sendPublisherCredentials } from "@/lib/email";
import { trackingBaseUrl } from "@/lib/tracking";
import { z } from "zod";

const schema = z.object({
  to: z.string().email(),
  publisherName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());
    const result = await sendPublisherCredentials({
      to: body.to,
      publisherName: body.publisherName,
      email: body.email,
      password: body.password,
      loginUrl: `${trackingBaseUrl().replace(/\/$/, "")}/login`,
    });
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
