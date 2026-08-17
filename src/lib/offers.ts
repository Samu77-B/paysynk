import type {
  DiscountKind,
  GiftMode,
  Offer,
  OfferKind,
} from "@/generated/prisma/client";

export type PublicOffer = {
  id: string;
  kind: OfferKind;
  title: string;
  code: string | null;
  discountKind: DiscountKind | null;
  discountValue: number | null;
  minSubtotalMinor: number | null;
  productIdA: string | null;
  productIdB: string | null;
  bundleOffMinor: number | null;
  giftProductId: string | null;
  giftMode: GiftMode | null;
  giftTitle: string | null;
};

export type GiftPreview = {
  offerId: string;
  productId: string;
  title: string;
  quantity: number;
};

export function normalizeOfferCode(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

export function toPublicOffer(
  offer: Offer,
  giftTitle?: string | null,
): PublicOffer {
  return {
    id: offer.id,
    kind: offer.kind,
    title: offer.title,
    code: offer.code,
    discountKind: offer.discountKind,
    discountValue: offer.discountValue,
    minSubtotalMinor: offer.minSubtotalMinor,
    productIdA: offer.productIdA,
    productIdB: offer.productIdB,
    bundleOffMinor: offer.bundleOffMinor,
    giftProductId: offer.giftProductId,
    giftMode: offer.giftMode,
    giftTitle: giftTitle ?? null,
  };
}

export function qtyForProduct(
  lines: Array<{ productId: string; quantity: number }>,
  productId: string,
) {
  return lines
    .filter((line) => line.productId === productId)
    .reduce((sum, line) => sum + line.quantity, 0);
}

export function previewGifts(
  lines: Array<{ productId: string; quantity: number }>,
  offers: PublicOffer[],
): GiftPreview[] {
  const paidQty = lines
    .filter((line) => {
      const isGiftSku = offers.some(
        (offer) =>
          offer.kind === "gift" && offer.giftProductId === line.productId,
      );
      return !isGiftSku;
    })
    .reduce((sum, line) => sum + line.quantity, 0);

  if (paidQty <= 0) return [];

  const gifts: GiftPreview[] = [];
  for (const offer of offers) {
    if (offer.kind !== "gift" || !offer.giftProductId) continue;
    const quantity = offer.giftMode === "per_order" ? 1 : paidQty;
    gifts.push({
      offerId: offer.id,
      productId: offer.giftProductId,
      title: offer.giftTitle || offer.title,
      quantity,
    });
  }
  return gifts;
}
