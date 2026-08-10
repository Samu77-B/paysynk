import type { ProductKind } from "@/generated/prisma/client";

export type PricedLine = {
  variantId: string;
  productId: string;
  title: string;
  kind: ProductKind;
  options: Record<string, string>;
  sku: string;
  /** Catalogue unit price from DB (before bundle discount) */
  catalogueUnitMinor: number;
  quantity: number;
};

export type PricingResult = {
  lines: Array<
    PricedLine & {
      /** Effective average unit after bundle allocation (for Stripe line items) */
      unitPriceMinor: number;
      lineTotalMinor: number;
    }
  >;
  /** Sum of catalogue unit × qty before bundle discount */
  catalogueSubtotalMinor: number;
  /** Payable merchandise total after bundle discount */
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  bundlePairs: number;
  discountMinor: number;
};

const DISCOUNT_PER_BUNDLE_PAIR = 300; // £23 catalogue → £20 bundle

/**
 * Optional bundle rule: one tee + one tote in the same cart → £20 for that pair (not £23).
 * Extra tees/totes stay at catalogue price. Shipping is flat UK rate from the store.
 * Acme Store demo products use kind "other", so this discount does not apply there.
 *
 * Discount is allocated onto tote line totals (£3 off per bundled tote unit) so Stripe
 * Checkout can use non-negative line amounts (negative unit_amount is not allowed).
 */
export function priceCart(
  lines: PricedLine[],
  shippingFlatMinor: number,
): PricingResult {
  let teeQty = 0;
  let toteQty = 0;
  for (const line of lines) {
    if (line.kind === "tee") teeQty += line.quantity;
    if (line.kind === "tote") toteQty += line.quantity;
  }

  const bundlePairs = Math.min(teeQty, toteQty);
  const discountMinor = bundlePairs * DISCOUNT_PER_BUNDLE_PAIR;

  let remainingDiscountUnits = bundlePairs;

  const pricedLines = lines.map((line) => {
    const catalogueLine = line.catalogueUnitMinor * line.quantity;
    let discountOnLine = 0;

    if (line.kind === "tote" && remainingDiscountUnits > 0) {
      const apply = Math.min(line.quantity, remainingDiscountUnits);
      discountOnLine = apply * DISCOUNT_PER_BUNDLE_PAIR;
      remainingDiscountUnits -= apply;
    }

    const lineTotalMinor = catalogueLine - discountOnLine;
    const unitPriceMinor =
      line.quantity > 0 ? Math.round(lineTotalMinor / line.quantity) : 0;

    return {
      ...line,
      unitPriceMinor,
      lineTotalMinor,
    };
  });

  // Guard against rounding drift: force line totals to sum to expected subtotal
  const rawSubtotal = pricedLines.reduce((sum, l) => sum + l.lineTotalMinor, 0);
  const catalogueSubtotalMinor = lines.reduce(
    (sum, l) => sum + l.catalogueUnitMinor * l.quantity,
    0,
  );
  const subtotalMinor = catalogueSubtotalMinor - discountMinor;

  if (rawSubtotal !== subtotalMinor && pricedLines.length > 0) {
    const last = pricedLines[pricedLines.length - 1];
    last.lineTotalMinor += subtotalMinor - rawSubtotal;
    last.unitPriceMinor = Math.round(last.lineTotalMinor / last.quantity);
  }

  const shippingMinor = lines.length > 0 ? shippingFlatMinor : 0;
  const totalMinor = subtotalMinor + shippingMinor;

  return {
    lines: pricedLines,
    catalogueSubtotalMinor,
    subtotalMinor,
    shippingMinor,
    totalMinor,
    bundlePairs,
    discountMinor,
  };
}

export function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);
}
