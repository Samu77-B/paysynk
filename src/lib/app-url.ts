/**
 * Origin used for Stripe success/cancel URLs.
 * Stripe requires an explicit http(s) scheme — a bare host like www.paysynk.com fails.
 */
export function resolveAppOrigin(requestUrl: string): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ?? "";
  const candidate = raw
    ? /^https?:\/\//i.test(raw)
      ? raw
      : `https://${raw}`
    : requestUrl;

  try {
    return new URL(candidate).origin;
  } catch {
    return new URL(requestUrl).origin;
  }
}
