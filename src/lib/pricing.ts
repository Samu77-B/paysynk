import type { ProductKind } from "@/generated/prisma/client";
import {
  normalizeOfferCode,
  previewGifts,
  qtyForProduct,
  type GiftPreview,
  type PublicOffer,
} from "@/lib/offers";

export type PricedLine = {
  variantId: string | null;
  productId: string;
  title: string;
  kind: ProductKind;
  options: Record<string, string>;
  sku: string;
  /** Catalogue unit price from DB (before discounts) */
  catalogueUnitMinor: number;
  quantity: number;
};

export type PriceCartOptions = {
  offers?: PublicOffer[];
  discountCode?: string | null;
};

export type PricingResult = {
  lines: Array<
    PricedLine & {
      /** Effective average unit after discount allocation (for Stripe line items) */
      unitPriceMinor: number;
      lineTotalMinor: number;
    }
  >;
  /** Sum of catalogue unit × qty before discounts */
  catalogueSubtotalMinor: number;
  /** Payable merchandise total after discounts */
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  bundlePairs: number;
  discountMinor: number;
  discountLabel?: string;
  appliedCode: string | null;
  codeError: string | null;
  gifts: GiftPreview[];
};

const LEGACY_DISCOUNT_PER_BUNDLE_PAIR = 300; // £23 catalogue → £20 bundle

function qtyByKind(lines: PricedLine[], kind: ProductKind) {
  return lines
    .filter((line) => line.kind === kind)
    .reduce((sum, line) => sum + line.quantity, 0);
}

/**
 * Server (and cart preview) pricing:
 * 1. Catalogue subtotal
 * 2. Merchant bundle offers (buy product A with product B → £ off per pair)
 * 3. Legacy tee+tote pair discount when Product.kind is set
 * 4. Typed promo code on the remaining merchandise total
 * 5. Gift previews (free lines are added at checkout, not here)
 *
 * Discounts are allocated onto line totals so Stripe can use non-negative amounts.
 */
export function priceCart(
  lines: PricedLine[],
  shippingFlatMinor: number,
  opts: PriceCartOptions = {},
): PricingResult {
  const offers = opts.offers ?? [];
  const labels: string[] = [];

  let bundlePairs = 0;
  let bundleDiscount = 0;

  for (const offer of offers) {
    if (
      offer.kind !== "bundle" ||
      !offer.productIdA ||
      !offer.productIdB ||
      !offer.bundleOffMinor
    ) {
      continue;
    }
    const pairs = Math.min(
      qtyForProduct(lines, offer.productIdA),
      qtyForProduct(lines, offer.productIdB),
    );
    if (pairs > 0) {
      bundlePairs += pairs;
      bundleDiscount += pairs * offer.bundleOffMinor;
      labels.push(offer.title);
    }
  }

  const legacyPairs = Math.min(qtyByKind(lines, "tee"), qtyByKind(lines, "tote"));
  if (legacyPairs > 0) {
    bundlePairs += legacyPairs;
    bundleDiscount += legacyPairs * LEGACY_DISCOUNT_PER_BUNDLE_PAIR;
    labels.push("Tee + tote bundle");
  }

  const catalogueSubtotalMinor = lines.reduce(
    (sum, line) => sum + line.catalogueUnitMinor * line.quantity,
    0,
  );
  const afterBundle = Math.max(0, catalogueSubtotalMinor - bundleDiscount);

  let codeDiscount = 0;
  let appliedCode: string | null = null;
  let codeError: string | null = null;
  const rawCode = normalizeOfferCode(opts.discountCode);

  if (rawCode) {
    const match = offers.find(
      (offer) => offer.kind === "code" && offer.code === rawCode,
    );
    if (!match) {
      codeError = "That code is not valid.";
    } else if (
      match.minSubtotalMinor &&
      afterBundle < match.minSubtotalMinor
    ) {
      codeError = `This code needs a minimum spend of ${(match.minSubtotalMinor / 100).toFixed(2)}.`;
    } else {
      const value = Math.max(0, match.discountValue ?? 0);
      if (match.discountKind === "percent") {
        codeDiscount = Math.floor((afterBundle * Math.min(100, value)) / 100);
      } else {
        codeDiscount = Math.min(afterBundle, value);
      }
      appliedCode = rawCode;
      if (codeDiscount > 0) labels.push(match.title);
    }
  }

  const discountMinor = Math.min(
    catalogueSubtotalMinor,
    bundleDiscount + (codeError ? 0 : codeDiscount),
  );
  const subtotalMinor = catalogueSubtotalMinor - discountMinor;

  let remainingDiscount = discountMinor;
  const pricedLines = lines.map((line, index) => {
    const catalogueLine = line.catalogueUnitMinor * line.quantity;
    const isLast = index === lines.length - 1;
    const discountOnLine = isLast
      ? Math.min(catalogueLine, remainingDiscount)
      : Math.min(catalogueLine, remainingDiscount);
    remainingDiscount -= discountOnLine;
    const lineTotalMinor = catalogueLine - discountOnLine;
    const unitPriceMinor =
      line.quantity > 0 ? Math.round(lineTotalMinor / line.quantity) : 0;
    return {
      ...line,
      unitPriceMinor,
      lineTotalMinor,
    };
  });

  const rawSubtotal = pricedLines.reduce((sum, l) => sum + l.lineTotalMinor, 0);
  if (rawSubtotal !== subtotalMinor && pricedLines.length > 0) {
    const last = pricedLines[pricedLines.length - 1];
    last.lineTotalMinor += subtotalMinor - rawSubtotal;
    last.unitPriceMinor =
      last.quantity > 0 ? Math.round(last.lineTotalMinor / last.quantity) : 0;
  }

  const shippingMinor = lines.length > 0 ? shippingFlatMinor : 0;
  const totalMinor = subtotalMinor + shippingMinor;
  const gifts = previewGifts(lines, offers);

  return {
    lines: pricedLines,
    catalogueSubtotalMinor,
    subtotalMinor,
    shippingMinor,
    totalMinor,
    bundlePairs,
    discountMinor,
    discountLabel: labels.length ? labels.join(" · ") : undefined,
    appliedCode: codeError ? null : appliedCode,
    codeError,
    gifts,
  };
}

export function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);
}
