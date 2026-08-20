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
 * Discounts: baked into line unit amounts (Stripe disallows negative / £0 prices).
 * Free gifts stay on the PaySynk order, not as Stripe line items.
 *
 * Direct charges: when the shop has connected Stripe, Checkout runs on their
 * account (`stripeAccount`) so funds land with them. No platform application fee.
 * TODO: FAC / PowerTranz.
 */
export class StripePaymentProvider implements PaymentProvider {
  async createCheckout(
    input: CreateCheckoutInput,
  ): Promise<CreateCheckoutResult> {
    const stripe = getStripe();

    const payable = input.lines.filter((line) => line.lineTotalMinor > 0);
    // Stripe rejects £0 line items. Free gifts stay on our Order, not on Stripe.
    let stripeLines = payable;
    let shippingAmount = input.shippingMinor;
    if (stripeLines.length === 0) {
      if (input.shippingMinor < 1) {
        throw new Error("Cannot create a Stripe checkout for a £0 order");
      }
      // 100% off merchandise: charge shipping as the only line so it is not added twice.
      stripeLines = [
        {
          name: input.shippingLabel ?? "UK shipping",
          quantity: 1,
          unitAmountMinor: input.shippingMinor,
          lineTotalMinor: input.shippingMinor,
        },
      ];
      shippingAmount = 0;
    }

    const extraNote = input.discountLabel || undefined;

    // Use quantity 1 + exact line total so discount rounding never drifts vs our Order totals.
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      stripeLines.map((line) => ({
        quantity: 1,
        price_data: {
          currency: input.currency,
          unit_amount: line.lineTotalMinor,
          product_data: {
            name:
              line.quantity > 1
                ? `${line.quantity}× ${line.name}`
                : line.name,
            description: extraNote,
          },
        },
      }));

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        client_reference_id: input.orderId,
        customer_creation: "always",
        metadata: {
          orderId: input.orderId,
          storeId: input.storeId,
          storeSlug: input.storeSlug,
          bundlePairs: String(input.bundlePairs ?? 0),
          discountMinor: String(input.discountMinor ?? 0),
          discountLabel: (input.discountLabel ?? "").slice(0, 500),
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
                amount: shippingAmount,
                currency: input.currency,
              },
              display_name: input.shippingLabel ?? "UK shipping",
            },
          },
        ],
      },
      input.stripeAccountId
        ? { stripeAccount: input.stripeAccountId }
        : undefined,
    );

    if (!session.url) {
      throw new Error("Stripe Checkout Session missing redirect URL");
    }

    return {
      redirectUrl: session.url,
      providerPaymentId: session.id,
    };
  }
}
