"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDashboardProduct } from "@/lib/dashboard/data";
import type { CatalogProduct } from "@/lib/dashboard/data";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function skuToken(value: string) {
  return value.replace(/\s+/g, "").slice(0, 8).toUpperCase();
}

function stockKey(colour?: string, size?: string) {
  return `${colour ?? ""}|${size ?? ""}`;
}

function lookupStock(
  stockByKey: Record<string, number> | undefined,
  colour: string | undefined,
  size: string | undefined,
  fallback: number,
) {
  const key = stockKey(colour, size);
  if (stockByKey && Object.hasOwn(stockByKey, key)) {
    const n = stockByKey[key];
    if (Number.isFinite(n)) return Math.max(0, Math.floor(n));
  }
  return fallback;
}

function collectImages(
  defaultImage: string | null | undefined,
  colourImages: Record<string, string> | undefined,
) {
  const urls = [defaultImage, ...Object.values(colourImages ?? {})].filter(
    (url): url is string => Boolean(url?.trim()),
  );
  return Array.from(new Set(urls));
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
  colourImages?: Record<string, string>;
  defaultImage?: string | null;
  stockByKey?: Record<string, number>;
}): Promise<{ product?: CatalogProduct; error?: string }> {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return { error: "Sign in to manage products." };

  if (!input.title.trim() || Number.isNaN(input.priceMinor)) {
    return { error: "Title and price are required." };
  }

  const colours = input.colours.filter(Boolean);
  const sizes = input.sizes.filter(Boolean);
  const baseSku = (input.sku || slugify(input.title) || "SKU").toUpperCase();
  const fallbackStock = Number.isFinite(input.stockQty)
    ? Math.max(0, Math.floor(input.stockQty))
    : 0;
  const variantRows: Array<{
    sku: string;
    stockQty: number;
    priceMinor: number;
    options: Record<string, string>;
    imageUrl: string | null;
  }> = [];

  if (colours.length && sizes.length) {
    for (const colour of colours) {
      for (const size of sizes) {
        variantRows.push({
          sku: `${baseSku}-${skuToken(colour)}-${size}`,
          stockQty: lookupStock(input.stockByKey, colour, size, fallbackStock),
          priceMinor: input.priceMinor,
          options: { colour, size },
          imageUrl: input.colourImages?.[colour]?.trim() || null,
        });
      }
    }
  } else if (colours.length) {
    for (const colour of colours) {
      variantRows.push({
        sku: `${baseSku}-${skuToken(colour)}`,
        stockQty: lookupStock(input.stockByKey, colour, undefined, fallbackStock),
        priceMinor: input.priceMinor,
        options: { colour },
        imageUrl: input.colourImages?.[colour]?.trim() || null,
      });
    }
  } else if (sizes.length) {
    for (const size of sizes) {
      variantRows.push({
        sku: `${baseSku}-${skuToken(size)}`,
        stockQty: lookupStock(input.stockByKey, undefined, size, fallbackStock),
        priceMinor: input.priceMinor,
        options: { size },
        imageUrl: input.defaultImage?.trim() || null,
      });
    }
  } else {
    variantRows.push({
      sku:
        input.sku ||
        `${(slugify(input.title) || "item").toUpperCase()}-${Date.now().toString(36).slice(-4)}`,
      stockQty: fallbackStock,
      priceMinor: input.priceMinor,
      options: {},
      imageUrl: input.defaultImage?.trim() || null,
    });
  }

  const images = collectImages(input.defaultImage, input.colourImages);

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
        images,
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
      images,
      variants: { create: variantRows },
    },
    include: { variants: true },
  });
  revalidatePath("/app/products");
  revalidatePath(`/s/${session.user.storeSlug}`);
  return { product: toDashboardProduct(product, storeId) };
}

export async function deleteDashboardProduct(
  productId: string,
): Promise<{ ok?: true; error?: string }> {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return { error: "Sign in to manage products." };

  const existing = await prisma.product.findFirst({
    where: { id: productId, storeId },
    select: { id: true },
  });
  if (!existing) return { error: "Product not found." };

  await prisma.product.delete({ where: { id: existing.id } });
  revalidatePath("/app/products");
  revalidatePath(`/s/${session.user.storeSlug}`);
  return { ok: true };
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
  activate: boolean;
}) {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return { error: "Sign in to update payments." };

  const current = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      paymentsActive: true,
      stripeConnectId: true,
      paypalMerchantId: true,
    },
  });
  if (!current) return { error: "Store not found." };

  if (input.activate && !current.stripeConnectId && !current.paypalMerchantId) {
    return {
      error: "Connect Stripe or PayPal first, then activate checkout.",
    };
  }

  const paymentsActive = input.activate ? true : current.paymentsActive;

  await prisma.store.update({
    where: { id: storeId },
    data: { paymentsActive },
  });
  revalidatePath("/app/settings/payments");
  revalidatePath("/app/products");
  return { ok: true as const, paymentsActive };
}

export async function disconnectPaymentProvider(provider: "stripe" | "paypal") {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return { error: "Sign in to update payments." };

  const current = await prisma.store.findUnique({
    where: { id: storeId },
    select: { stripeConnectId: true, paypalMerchantId: true },
  });
  if (!current) return { error: "Store not found." };

  const stripeConnectId =
    provider === "stripe" ? null : current.stripeConnectId;
  const paypalMerchantId =
    provider === "paypal" ? null : current.paypalMerchantId;
  const stillConnected = Boolean(stripeConnectId || paypalMerchantId);

  await prisma.store.update({
    where: { id: storeId },
    data: {
      stripeConnectId,
      paypalMerchantId,
      paymentsActive: stillConnected,
    },
  });
  revalidatePath("/app/settings/payments");
  revalidatePath("/app/products");
  return { ok: true as const };
}

export async function saveShippingSettings(input: {
  pounds: string;
}): Promise<{ error?: string; shippingFlatMinor?: number }> {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return { error: "Sign in to update delivery." };

  const pounds = Number(input.pounds);
  if (!Number.isFinite(pounds) || pounds < 0 || pounds > 999.99) {
    return { error: "Enter a delivery charge from £0.00 to £999.99." };
  }

  const shippingFlatMinor = Math.round(pounds * 100);
  await prisma.store.update({
    where: { id: storeId },
    data: { shippingFlatMinor },
  });
  revalidatePath("/app/settings");
  if (session.user.storeSlug) {
    revalidatePath(`/s/${session.user.storeSlug}`);
  }
  return { shippingFlatMinor };
}

export async function saveStoreLogo(input: {
  logoUrl: string | null;
}): Promise<{ error?: string; logoUrl?: string | null }> {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return { error: "Sign in to update your logo." };

  const logoUrl = input.logoUrl?.trim() || null;
  await prisma.store.update({
    where: { id: storeId },
    data: { logoUrl },
  });
  revalidatePath("/app/settings");
  if (session.user.storeSlug) {
    revalidatePath(`/s/${session.user.storeSlug}`);
    revalidatePath(`/s/${session.user.storeSlug}/success`);
  }
  revalidatePath("/s/slf");
  return { logoUrl };
}

const REPORT_FREQUENCIES = ["none", "daily", "weekly", "monthly"] as const;
type SalesReportFrequency = (typeof REPORT_FREQUENCIES)[number];

function isReportFrequency(value: string): value is SalesReportFrequency {
  return (REPORT_FREQUENCIES as readonly string[]).includes(value);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function saveStoreProfileSettings(input: {
  vatNumber: string;
  notifyEmail: string;
  salesReportFrequency: string;
}): Promise<{
  error?: string;
  vatNumber?: string | null;
  notifyEmail?: string | null;
  salesReportFrequency?: SalesReportFrequency;
}> {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return { error: "Sign in to update store details." };

  const vatNumber = input.vatNumber.trim().slice(0, 32) || null;
  const notifyRaw = input.notifyEmail.trim();
  if (notifyRaw && !validEmail(notifyRaw)) {
    return { error: "Enter a valid notification email, or leave it blank." };
  }
  if (!isReportFrequency(input.salesReportFrequency)) {
    return { error: "Choose a sales report frequency." };
  }

  const notifyEmail = notifyRaw || null;
  const salesReportFrequency = input.salesReportFrequency;

  await prisma.store.update({
    where: { id: storeId },
    data: { vatNumber, notifyEmail, salesReportFrequency },
  });
  revalidatePath("/app/settings");
  if (session.user.storeSlug) {
    revalidatePath(`/s/${session.user.storeSlug}/success`);
  }
  return { vatNumber, notifyEmail, salesReportFrequency };
}
