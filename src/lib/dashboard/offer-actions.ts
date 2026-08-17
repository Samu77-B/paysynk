"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeOfferCode } from "@/lib/offers";

function poundsToMinor(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function isUniqueViolation(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}

async function requireStore() {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return null;
  return { storeId, storeSlug: session.user.storeSlug };
}

function revalidateOffers(storeSlug?: string | null) {
  revalidatePath("/app/offers");
  if (storeSlug) revalidatePath(`/s/${storeSlug}`);
}

export async function saveCodeOffer(input: {
  title: string;
  code: string;
  discountKind: "percent" | "amount";
  percentOrPounds: string;
  minSpendPounds: string;
}): Promise<{ error?: string }> {
  const authz = await requireStore();
  if (!authz) return { error: "Sign in to manage offers." };
  const { storeId, storeSlug } = authz;

  const title = input.title.trim();
  const code = normalizeOfferCode(input.code);
  if (!title || !code) return { error: "Title and code are required." };
  if (!/^[A-Z0-9][A-Z0-9-]{1,38}$/.test(code)) {
    return { error: "Use letters, numbers, and hyphens only (2–40 characters)." };
  }

  let discountValue = 0;
  if (input.discountKind === "percent") {
    const n = Number(input.percentOrPounds);
    if (!Number.isFinite(n) || n < 1 || n > 100) {
      return { error: "Percent off must be between 1 and 100." };
    }
    discountValue = Math.floor(n);
  } else {
    const minor = poundsToMinor(input.percentOrPounds);
    if (minor == null || minor < 1) return { error: "Enter a pounds amount to take off." };
    discountValue = minor;
  }

  const minRaw = input.minSpendPounds.trim();
  const minSubtotalMinor = minRaw ? poundsToMinor(minRaw) : null;
  if (minRaw && (minSubtotalMinor == null || minSubtotalMinor < 0)) {
    return { error: "Minimum spend must be a valid amount." };
  }

  try {
    await prisma.offer.create({
      data: {
        storeId,
        kind: "code",
        title,
        code,
        discountKind: input.discountKind,
        discountValue,
        minSubtotalMinor: minSubtotalMinor || null,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: "That code is already in use on this store." };
    }
    throw err;
  }

  revalidateOffers(storeSlug);
  return {};
}

export async function saveBundleOffer(input: {
  title: string;
  productIdA: string;
  productIdB: string;
  offPounds: string;
}): Promise<{ error?: string }> {
  const authz = await requireStore();
  if (!authz) return { error: "Sign in to manage offers." };
  const { storeId, storeSlug } = authz;

  const title = input.title.trim() || "Bundle discount";
  if (!input.productIdA || !input.productIdB) {
    return { error: "Pick both products in the bundle." };
  }
  if (input.productIdA === input.productIdB) {
    return { error: "Pick two different products." };
  }
  const bundleOffMinor = poundsToMinor(input.offPounds);
  if (bundleOffMinor == null || bundleOffMinor < 1) {
    return { error: "Enter how much to take off each pair." };
  }

  const products = await prisma.product.findMany({
    where: {
      storeId,
      id: { in: [input.productIdA, input.productIdB] },
    },
    select: { id: true },
  });
  if (products.length !== 2) return { error: "Those products are not in this store." };

  await prisma.offer.create({
    data: {
      storeId,
      kind: "bundle",
      title,
      productIdA: input.productIdA,
      productIdB: input.productIdB,
      bundleOffMinor,
    },
  });

  revalidateOffers(storeSlug);
  return {};
}

export async function saveGiftOffer(input: {
  title: string;
  giftProductId: string;
  giftMode: "per_item" | "per_order";
}): Promise<{ error?: string }> {
  const authz = await requireStore();
  if (!authz) return { error: "Sign in to manage offers." };
  const { storeId, storeSlug } = authz;

  const title = input.title.trim() || "Free gift";
  if (!input.giftProductId) return { error: "Pick the free gift product." };

  const gift = await prisma.product.findFirst({
    where: { id: input.giftProductId, storeId },
    select: { id: true },
  });
  if (!gift) return { error: "That product is not in this store." };

  await prisma.offer.create({
    data: {
      storeId,
      kind: "gift",
      title,
      giftProductId: input.giftProductId,
      giftMode: input.giftMode,
    },
  });

  revalidateOffers(storeSlug);
  return {};
}

export async function setOfferActive(
  offerId: string,
  active: boolean,
): Promise<{ error?: string }> {
  const authz = await requireStore();
  if (!authz) return { error: "Sign in to manage offers." };
  const { storeId, storeSlug } = authz;

  const existing = await prisma.offer.findFirst({
    where: { id: offerId, storeId },
    select: { id: true },
  });
  if (!existing) return { error: "Offer not found." };

  await prisma.offer.update({
    where: { id: existing.id },
    data: { active },
  });
  revalidateOffers(storeSlug);
  return {};
}

export async function deleteOffer(
  offerId: string,
): Promise<{ error?: string }> {
  const authz = await requireStore();
  if (!authz) return { error: "Sign in to manage offers." };
  const { storeId, storeSlug } = authz;

  const existing = await prisma.offer.findFirst({
    where: { id: offerId, storeId },
    select: { id: true },
  });
  if (!existing) return { error: "Offer not found." };

  await prisma.offer.delete({ where: { id: existing.id } });
  revalidateOffers(storeSlug);
  return {};
}
