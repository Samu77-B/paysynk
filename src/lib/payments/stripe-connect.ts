import { getStripe } from "@/lib/payments/stripe";
import { resolveAppOrigin } from "@/lib/app-url";

export function stripeConnectConfigured() {
  return Boolean(process.env.STRIPE_CONNECT_CLIENT_ID?.trim());
}

export function stripeConnectAuthorizeUrl(opts: {
  state: string;
  requestUrl: string;
}) {
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("STRIPE_CONNECT_CLIENT_ID is not set");
  }
  const origin = resolveAppOrigin(opts.requestUrl);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_write",
    redirect_uri: `${origin}/api/connect/stripe/callback`,
    state: opts.state,
  });
  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeStripeConnectCode(code: string) {
  const stripe = getStripe();
  const token = await stripe.oauth.token({
    grant_type: "authorization_code",
    code,
  });
  const accountId = token.stripe_user_id;
  if (!accountId) {
    throw new Error("Stripe did not return a connected account id");
  }
  return accountId;
}
