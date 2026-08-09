import Stripe from "stripe";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
} from "./types";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

/**
 * Stripe Checkout Sessions provider.
 *
 * Shipping: Checkout `shipping_options` with a fixed amount (not a product line item).
 * Bundle discount: baked into line unit amounts before create (Stripe disallows negative prices).
 *
 * TODO: Stripe Connect / per-merchant keys — currently uses platform STRIPE_SECRET_KEY.
 */
export class StripePaymentProvider implements PaymentProvider {
  async createCheckout(
    input: CreateCheckoutInput,
  ): Promise<CreateCheckoutResult> {
    const stripe = getStripe();

    // Use quantity 1 + exact line total so bundle rounding never drifts vs our Order totals.
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      input.lines.map((line) => ({
        quantity: 1,
        price_data: {
          currency: input.currency,
          unit_amount: line.lineTotalMinor,
          product_data: {
            name:
              line.quantity > 1
                ? `${line.quantity}× ${line.name}`
                : line.name,
            description:
              input.bundlePairs && input.bundlePairs > 0
                ? "Includes tee+tote bundle pricing where applicable"
                : undefined,
          },
        },
      }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      client_reference_id: input.orderId,
      metadata: {
        orderId: input.orderId,
        storeId: input.storeId,
        storeSlug: input.storeSlug,
        bundlePairs: String(input.bundlePairs ?? 0),
        discountMinor: String(input.discountMinor ?? 0),
        ...input.metadata,
      },
      line_items,
      shipping_address_collection: {
        allowed_countries: ["GB"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: input.shippingMinor,
              currency: input.currency,
            },
            display_name: input.shippingLabel ?? "UK shipping",
          },
        },
      ],
    });

    if (!session.url) {
      throw new Error("Stripe Checkout Session missing redirect URL");
    }

    return {
      redirectUrl: session.url,
      providerPaymentId: session.id,
    };
  }
}
