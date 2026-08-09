import { NextResponse } from "next/server";
import { z } from "zod";
import { CheckoutError, createStoreCheckout } from "@/lib/checkout";

type Params = { params: Promise<{ slug: string }> };

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

/** POST checkout — validates stock/prices server-side, creates Stripe session. */
export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      new URL(req.url).origin;

    const result = await createStoreCheckout({
      storeSlug: slug,
      items: parsed.data.items,
      appUrl,
      channel: "online",
    });

    return NextResponse.json({
      orderId: result.orderId,
      redirectUrl: result.redirectUrl,
      pricing: {
        subtotalMinor: result.pricing.subtotalMinor,
        shippingMinor: result.pricing.shippingMinor,
        totalMinor: result.pricing.totalMinor,
        bundlePairs: result.pricing.bundlePairs,
        discountMinor: result.pricing.discountMinor,
      },
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
