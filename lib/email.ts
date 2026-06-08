import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress =
  process.env.RESEND_FROM_EMAIL || "ClickVibe <onboarding@trackcenter.info>";
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
): Promise<{ sent: boolean; error?: string; messageId?: string }> {
  console.log("[email] sendPublisherCredentials called", {
    to: params.to,
    publisherName: params.publisherName,
    loginEmail: params.email,
    loginUrl: params.loginUrl,
    from: fromAddress,
    hasApiKey: Boolean(apiKey),
  });

  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping credentials email.", {
      to: params.to,
    });
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    console.log("[email] Calling Resend API…", { to: params.to, from: fromAddress });
    const { data, error } = await resend.emails.send({
      from: fromAddress,
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

    if (error) {
      console.error("[email] Resend API error", {
        to: params.to,
        from: fromAddress,
        errorName: error.name,
        errorMessage: error.message,
      });
      return { sent: false, error: error.message };
    }
    if (!data?.id) {
      console.error("[email] Resend returned no message id", {
        to: params.to,
        data,
      });
      return { sent: false, error: "Resend returned no message id" };
    }

    console.log("[email] Credentials email sent successfully", {
      to: params.to,
      messageId: data.id,
    });
    return { sent: true, messageId: data.id };
  } catch (err) {
    console.error("[email] Failed to send credentials", {
      to: params.to,
      error: err instanceof Error ? err.message : err,
    });
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
