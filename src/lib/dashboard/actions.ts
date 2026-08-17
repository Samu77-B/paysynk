"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDashboardProduct } from "@/lib/dashboard/data";
import type { Product } from "@/types/database";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function saveDashboardProduct(input: {
  id?: string;
  title: string;
  description: string;
  priceMinor: number;
  sku: string | null;
  stockQty: number;
  isActive: boolean;
  colours: string[];
  sizes: string[];
}): Promise<{ product?: Product; error?: string }> {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return { error: "Sign in to manage products." };

  if (!input.title.trim() || Number.isNaN(input.priceMinor)) {
    return { error: "Title and price are required." };
  }

  const colours = input.colours.length ? input.colours : [];
  const sizes = input.sizes.length ? input.sizes : [];
  const variantRows: Array<{
    sku: string;
    stockQty: number;
    priceMinor: number;
    options: Record<string, string>;
  }> = [];

  if (colours.length && sizes.length) {
    for (const colour of colours) {
      for (const size of sizes) {
        variantRows.push({
          sku: `${(input.sku || slugify(input.title) || "SKU").toUpperCase()}-${colour.replace(/\s+/g, "").slice(0, 8).toUpperCase()}-${size}`,
          stockQty: input.stockQty,
          priceMinor: input.priceMinor,
          options: { colour, size },
        });
      }
    }
  } else if (colours.length) {
    for (const colour of colours) {
      variantRows.push({
        sku: `${(input.sku || slugify(input.title) || "SKU").toUpperCase()}-${colour.replace(/\s+/g, "").slice(0, 8).toUpperCase()}`,
        stockQty: input.stockQty,
        priceMinor: input.priceMinor,
        options: { colour },
      });
    }
  } else {
    variantRows.push({
      sku:
        input.sku ||
        `${(slugify(input.title) || "item").toUpperCase()}-${Date.now().toString(36).slice(-4)}`,
      stockQty: input.stockQty,
      priceMinor: input.priceMinor,
      options: {},
    });
  }

  if (input.id) {
    const existing = await prisma.product.findFirst({
      where: { id: input.id, storeId },
    });
    if (!existing) return { error: "Product not found." };

    await prisma.variant.deleteMany({ where: { productId: existing.id } });
    const product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        title: input.title.trim(),
        description: input.description,
        active: input.isActive,
        variants: { create: variantRows },
      },
      include: { variants: true },
    });
    revalidatePath("/app/products");
    revalidatePath(`/s/${session.user.storeSlug}`);
    return { product: toDashboardProduct(product, storeId) };
  }

  const product = await prisma.product.create({
    data: {
      storeId,
      title: input.title.trim(),
      description: input.description,
      active: input.isActive,
      kind: "other",
      variants: { create: variantRows },
    },
    include: { variants: true },
  });
  revalidatePath("/app/products");
  revalidatePath(`/s/${session.user.storeSlug}`);
  return { product: toDashboardProduct(product, storeId) };
}

export async function markOrderFulfilled(orderId: string) {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return { error: "Sign in to update orders." };

  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
  });
  if (!order) return { error: "Order not found." };

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "fulfilled" },
  });
  revalidatePath("/app/orders");
  return { ok: true as const };
}

export async function savePaymentSettings(input: {
  stripeConnectId: string;
  paypalMerchantId: string;
  activate: boolean;
}) {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return { error: "Sign in to update payments." };

  const stripeConnectId = input.stripeConnectId.trim() || null;
  const paypalMerchantId = input.paypalMerchantId.trim() || null;
  const paymentsActive =
    input.activate && Boolean(stripeConnectId || paypalMerchantId);

  await prisma.store.update({
    where: { id: storeId },
    data: { stripeConnectId, paypalMerchantId, paymentsActive },
  });
  revalidatePath("/app/settings/payments");
  return { ok: true as const, paymentsActive };
}
