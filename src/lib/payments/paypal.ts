import { resolveAppOrigin } from "@/lib/app-url";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
} from "./types";

function paypalApiBase() {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function paypalConnectConfigured() {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID?.trim() &&
      process.env.PAYPAL_CLIENT_SECRET?.trim(),
  );
}

async function paypalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !secret) {
    throw new Error("PayPal is not configured.");
  }
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error || "PayPal authentication failed");
  }
  return data.access_token;
}

async function paypalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await paypalAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  const bn = process.env.PAYPAL_BN_CODE?.trim();
  if (bn) headers.set("PayPal-Partner-Attribution-Id", bn);

  const res = await fetch(`${paypalApiBase()}${path}`, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as T & {
    message?: string;
    details?: Array<{ description?: string }>;
  };
  if (!res.ok) {
    const detail = data.details?.[0]?.description || data.message;
    throw new Error(detail || `PayPal request failed (${res.status})`);
  }
  return data;
}

type PayPalLink = { href?: string; rel?: string };

export async function createPaypalOnboardingUrl(opts: {
  storeId: string;
  requestUrl: string;
}) {
  const origin = resolveAppOrigin(opts.requestUrl);
  const body = {
    tracking_id: opts.storeId,
    partner_config_override: {
      return_url: `${origin}/api/connect/paypal/callback`,
      return_url_description: "Return to PaySynk",
      show_add_credit_card: true,
    },
    operations: [
      {
        operation: "API_INTEGRATION",
        api_integration_preference: {
          rest_api_integration: {
            integration_method: "PAYPAL",
            integration_type: "THIRD_PARTY",
            third_party_details: {
              features: ["PAYMENT", "REFUND"],
            },
          },
        },
      },
    ],
    products: ["EXPRESS_CHECKOUT"],
    legal_consents: [{ type: "SHARE_DATA_CONSENT", granted: true }],
  };

  const data = await paypalFetch<{ links?: PayPalLink[] }>(
    "/v2/customer/partner-referrals",
    { method: "POST", body: JSON.stringify(body) },
  );
  const action =
    data.links?.find((link) => link.rel === "action_url")?.href ??
    data.links?.[0]?.href;
  if (!action) {
    throw new Error("PayPal did not return an onboarding link");
  }
  return action;
}

function moneyMajor(minor: number) {
  return (minor / 100).toFixed(2);
}

export class PaypalPaymentProvider implements PaymentProvider {
  async createCheckout(
    input: CreateCheckoutInput,
  ): Promise<CreateCheckoutResult> {
    if (!input.paypalMerchantId) {
      throw new Error("This shop has not connected PayPal yet.");
    }

    const data = await paypalFetch<{ id?: string; links?: PayPalLink[] }>(
      "/v2/checkout/orders",
      {
        method: "POST",
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              custom_id: input.orderId,
              invoice_id: input.orderId.slice(-12),
              amount: {
                currency_code: input.currency.toUpperCase(),
                value: moneyMajor(input.totalMinor),
              },
              payee: { merchant_id: input.paypalMerchantId },
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                brand_name: input.storeName?.slice(0, 127) || "PaySynk",
                shipping_preference: "GET_FROM_FILE",
                user_action: "PAY_NOW",
                return_url:
                  input.completeUrl ||
                  input.successUrl,
                cancel_url: input.cancelUrl,
              },
            },
          },
        }),
      },
    );

    const redirectUrl =
      data.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")
        ?.href;
    if (!data.id || !redirectUrl) {
      throw new Error("PayPal checkout did not return an approval URL");
    }
    return { redirectUrl, providerPaymentId: data.id };
  }
}

export async function capturePaypalOrder(paypalOrderId: string) {
  const data = await paypalFetch<{
    status?: string;
    payment_source?: { paypal?: { email_address?: string; name?: { given_name?: string; surname?: string } } };
    payer?: { email_address?: string; name?: { given_name?: string; surname?: string } };
    purchase_units?: Array<{ custom_id?: string }>;
  }>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    body: "{}",
  });
  const payer = data.payer ?? data.payment_source?.paypal;
  const name = [payer?.name?.given_name, payer?.name?.surname]
    .filter(Boolean)
    .join(" ");
  return {
    status: data.status,
    orderId: data.purchase_units?.[0]?.custom_id,
    customerEmail: payer?.email_address ?? null,
    customerName: name || null,
  };
}
