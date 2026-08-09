import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";
import { priceCart, type PricedLine } from "@/lib/pricing";
import type { Prisma } from "@/generated/prisma/client";

export type CheckoutItemInput = {
  variantId: string;
  quantity: number;
};

/**
 * Server-side checkout: load store + variants from DB, re-validate stock/prices,
 * apply bundle + shipping, create pending Order, then redirect via payment provider.
 */
export async function createStoreCheckout(opts: {
  storeSlug: string;
  items: CheckoutItemInput[];
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

  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store) {
    throw new CheckoutError("Store not found", 404);
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

  const pricing = priceCart(pricedInput, store.shippingFlatMinor);

  const order = await prisma.order.create({
    data: {
      storeId: store.id,
      status: "pending",
      channel,
      paymentProvider: store.paymentProvider,
      currency: store.currency,
      subtotalMinor: pricing.subtotalMinor,
      shippingMinor: pricing.shippingMinor,
      totalMinor: pricing.totalMinor,
      items: {
        create: pricing.lines.map((line) => ({
          variantId: line.variantId,
          title: line.title,
          optionsSnapshot: line.options as Prisma.InputJsonValue,
          sku: line.sku,
          unitPriceMinor: line.unitPriceMinor,
          quantity: line.quantity,
          lineTotalMinor: line.lineTotalMinor,
        })),
      },
    },
  });

  const provider = getPaymentProvider(store.paymentProvider);
  const checkout = await provider.createCheckout({
    storeId: store.id,
    storeSlug: store.slug,
    currency: store.currency,
    orderId: order.id,
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
    discountLabel:
      pricing.bundlePairs > 0
        ? `Bundle discount (${pricing.bundlePairs}× tee + tote)`
        : undefined,
    successUrl: `${appUrl}/s/${store.slug}/success?order=${order.id}`,
    cancelUrl: `${appUrl}/s/${store.slug}?cancelled=1`,
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
