import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

interface CredentialsEmail {
  to: string;
  publisherName: string;
  email: string;
  password: string;
  loginUrl: string;
}

/**
 * Sends publisher login credentials. If RESEND_API_KEY is not set, this is a
 * no-op that returns { sent: false } so local dev works without email config.
 */
export async function sendPublisherCredentials(
  params: CredentialsEmail
): Promise<{ sent: boolean; error?: string }> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping credentials email.");
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    await resend.emails.send({
      from: "ClickVibe <onboarding@trackcenter.info>",
      to: params.to,
      subject: "Your ClickVibe login credentials",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;color:#0D1B4B;">
          <h2 style="color:#0D1B4B;">Welcome to ClickVibe, ${params.publisherName}!</h2>
          <p>Your publisher account has been created. Use the credentials below to log in:</p>
          <table style="border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:6px 12px;color:#6B7280;">Login URL</td><td style="padding:6px 12px;"><a href="${params.loginUrl}">${params.loginUrl}</a></td></tr>
            <tr><td style="padding:6px 12px;color:#6B7280;">Email</td><td style="padding:6px 12px;"><strong>${params.email}</strong></td></tr>
            <tr><td style="padding:6px 12px;color:#6B7280;">Password</td><td style="padding:6px 12px;"><strong>${params.password}</strong></td></tr>
          </table>
          <p style="color:#6B7280;font-size:13px;">Please change your password after first login.</p>
        </div>
      `,
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] Failed to send credentials:", err);
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
