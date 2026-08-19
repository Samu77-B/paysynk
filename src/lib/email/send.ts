import { Resend } from "resend";

function fromAddress(storeName: string) {
  const raw = process.env.RESEND_FROM?.trim() || "PaySynk <noreply@paysynk.com>";
  const match = raw.match(/^(.*)<([^>]+)>$/);
  const email = match ? match[2].trim() : raw;
  const safeName = storeName.replace(/[<>]/g, "").slice(0, 80);
  return `${safeName} <${email}>`;
}

export async function sendMail(opts: {
  storeName: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set; skipping email", opts.subject);
    return { ok: false, error: "Email is not configured." };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: fromAddress(opts.storeName),
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    });
    if (error) {
      console.error("Resend error", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("sendMail failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Email failed",
    };
  }
}
