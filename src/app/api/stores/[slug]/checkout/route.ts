import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { resolveAppOrigin } from "@/lib/app-url";
import { CheckoutError, createStoreCheckout } from "@/lib/checkout";
import { embedCorsPreflight, withEmbedCors } from "@/lib/embed-cors";

function publicCheckoutError(err: unknown): string {
  if (err instanceof Stripe.errors.StripeError) {
    return "Payment provider rejected this checkout. Try again.";
  }
  if (err instanceof Error && err.message.includes("STRIPE_SECRET_KEY")) {
    return "Checkout is not configured on the server.";
  }
  return "Checkout failed";
}

type Params = { params: Promise<{ slug: string }> };

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1)
    .max(50),
  discountCode: z.string().max(40).optional(),
});

export async function OPTIONS() {
  return embedCorsPreflight();
}

/** POST checkout — validates stock/prices server-side, creates Stripe session. */
export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return withEmbedCors(
        NextResponse.json(
          { error: "Invalid body", details: parsed.error.flatten() },
          { status: 400 },
        ),
      );
    }

    const appUrl = resolveAppOrigin(req.url);

    const result = await createStoreCheckout({
      storeSlug: slug,
      items: parsed.data.items,
      discountCode: parsed.data.discountCode,
      appUrl,
      channel: "online",
    });

    return withEmbedCors(
      NextResponse.json({
        orderId: result.orderId,
        redirectUrl: result.redirectUrl,
        pricing: {
          subtotalMinor: result.pricing.subtotalMinor,
          shippingMinor: result.pricing.shippingMinor,
          totalMinor: result.pricing.totalMinor,
          bundlePairs: result.pricing.bundlePairs,
          discountMinor: result.pricing.discountMinor,
          appliedCode: result.pricing.appliedCode,
          gifts: result.pricing.gifts,
        },
      }),
    );
  } catch (err) {
    if (err instanceof CheckoutError) {
      return withEmbedCors(
        NextResponse.json({ error: err.message }, { status: err.status }),
      );
    }
    console.error(err);
    return withEmbedCors(
      NextResponse.json(
        { error: publicCheckoutError(err) },
        { status: 500 },
      ),
    );
  }
}
