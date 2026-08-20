import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";
import { priceCart, type PricedLine } from "@/lib/pricing";
import { getActiveStoreOffers } from "@/lib/store-offers";
import { findStoreByPublicSlug } from "@/lib/store-lookup";
import type { Prisma } from "@/generated/prisma/client";

export type CheckoutItemInput = {
  variantId: string;
  quantity: number;
};

/**
 * Server-side checkout: load store + variants from DB, re-validate stock/prices,
 * apply offers + shipping, create pending Order, then redirect via payment provider.
 */
export async function createStoreCheckout(opts: {
  storeSlug: string;
  items: CheckoutItemInput[];
  discountCode?: string | null;
  channel?: "online" | "pos";
  appUrl: string;
}) {
  const { storeSlug, items, appUrl } = opts;
  const channel = opts.channel ?? "online";

  if (!items.length) {
    throw new CheckoutError("Cart is empty", 400);
  }

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new CheckoutError("Invalid quantity", 400);
    }
  }

  const store = await findStoreByPublicSlug(storeSlug);
  if (!store) {
    throw new CheckoutError("Store not found", 404);
  }
  if (store.signupStatus !== "approved") {
    throw new CheckoutError("This shop is not live yet", 403);
  }
  if (!store.paymentsActive) {
    throw new CheckoutError("This shop is not taking payments yet", 403);
  }

  const variantIds = items.map((i) => i.variantId);
  const variants = await prisma.variant.findMany({
    where: {
      id: { in: variantIds },
      product: { storeId: store.id, active: true },
    },
    include: { product: true },
  });

  if (variants.length !== new Set(variantIds).size) {
    throw new CheckoutError("One or more variants are invalid for this store", 400);
  }

  const byId = new Map(variants.map((v) => [v.id, v]));
  const pricedInput: PricedLine[] = [];

  for (const item of items) {
    const variant = byId.get(item.variantId)!;
    if (variant.stockQty < item.quantity) {
      throw new CheckoutError(
        `Insufficient stock for ${variant.sku} (have ${variant.stockQty})`,
        409,
      );
    }
    pricedInput.push({
      variantId: variant.id,
      productId: variant.productId,
      title: variant.product.title,
      kind: variant.product.kind,
      options: (variant.options ?? {}) as Record<string, string>,
      sku: variant.sku,
      catalogueUnitMinor: variant.priceMinor,
      quantity: item.quantity,
    });
  }

  const offers = await getActiveStoreOffers(store.id);
  const pricing = priceCart(pricedInput, store.shippingFlatMinor, {
    offers,
    discountCode: opts.discountCode,
  });

  if (opts.discountCode?.trim() && pricing.codeError) {
    throw new CheckoutError(pricing.codeError, 400);
  }

  const giftItems: Array<{
    variantId: string;
    title: string;
    optionsSnapshot: Prisma.InputJsonValue;
    sku: string;
    unitPriceMinor: number;
    quantity: number;
    lineTotalMinor: number;
  }> = [];
  for (const gift of pricing.gifts) {
    const giftProduct = await prisma.product.findFirst({
      where: { id: gift.productId, storeId: store.id },
      include: {
        variants: {
          where: { stockQty: { gt: 0 } },
          orderBy: { stockQty: "desc" },
        },
      },
    });
    const variant = giftProduct?.variants[0];
    if (!giftProduct || !variant) continue;

    const alreadyReserved = items
      .filter((item) => item.variantId === variant.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    const available = variant.stockQty - alreadyReserved;
    const quantity = Math.min(gift.quantity, available);
    if (quantity < 1) continue;

    giftItems.push({
      variantId: variant.id,
      title: `Free: ${giftProduct.title}`,
      optionsSnapshot: (variant.options ?? {}) as Prisma.InputJsonValue,
      sku: variant.sku,
      unitPriceMinor: 0,
      quantity,
      lineTotalMinor: 0,
    });
  }

  const checkoutProvider =
    store.paymentProvider === "fac"
      ? "fac"
      : store.paypalMerchantId && !store.stripeConnectId
        ? "paypal"
        : "stripe";

  const order = await prisma.order.create({
    data: {
      storeId: store.id,
      status: "pending",
      channel,
      paymentProvider: checkoutProvider,
      currency: store.currency,
      subtotalMinor: pricing.subtotalMinor,
      shippingMinor: pricing.shippingMinor,
      totalMinor: pricing.totalMinor,
      discountMinor: pricing.discountMinor,
      discountCode: pricing.appliedCode,
      items: {
        create: [
          ...pricing.lines.map((line) => ({
            variantId: line.variantId,
            title: line.title,
            optionsSnapshot: line.options as Prisma.InputJsonValue,
            sku: line.sku,
            unitPriceMinor: line.unitPriceMinor,
            quantity: line.quantity,
            lineTotalMinor: line.lineTotalMinor,
          })),
          ...giftItems,
        ],
      },
    },
  });

  const giftNote =
    giftItems.length > 0
      ? giftItems.map((g) => `${g.quantity}× ${g.title}`).join(", ")
      : undefined;

  const provider = getPaymentProvider(checkoutProvider);
  const checkout = await provider.createCheckout({
    storeId: store.id,
    storeSlug: store.slug,
    storeName: store.name,
    currency: store.currency,
    orderId: order.id,
    stripeAccountId: store.stripeConnectId,
    paypalMerchantId: store.paypalMerchantId,
    subtotalMinor: pricing.subtotalMinor,
    shippingMinor: pricing.shippingMinor,
    totalMinor: pricing.totalMinor,
    shippingLabel: "UK shipping",
    lines: pricing.lines.map((line) => {
      const optionLabel = Object.values(line.options).filter(Boolean).join(" / ");
      return {
        name: optionLabel ? `${line.title} — ${optionLabel}` : line.title,
        quantity: line.quantity,
        unitAmountMinor: line.unitPriceMinor,
        lineTotalMinor: line.lineTotalMinor,
      };
    }),
    discountMinor: pricing.discountMinor,
    bundlePairs: pricing.bundlePairs,
    discountLabel: [pricing.discountLabel, giftNote].filter(Boolean).join(" · ") || undefined,
    successUrl: `${appUrl}/s/${store.slug}/success?order=${order.id}`,
    cancelUrl: `${appUrl}/s/${store.slug}?cancelled=1`,
    completeUrl: `${appUrl}/api/paypal/complete?order=${order.id}`,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { providerPaymentId: checkout.providerPaymentId },
  });

  return {
    orderId: order.id,
    redirectUrl: checkout.redirectUrl,
    pricing,
  };
}

export class CheckoutError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "CheckoutError";
    this.status = status;
  }
}
