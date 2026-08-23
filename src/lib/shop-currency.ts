export const SHOP_CURRENCIES = [
  { code: "gbp", label: "GBP — British pound" },
  { code: "usd", label: "USD — US dollar" },
  { code: "eur", label: "EUR — Euro" },
  { code: "jmd", label: "JMD — Jamaican dollar" },
  { code: "cad", label: "CAD — Canadian dollar" },
  { code: "aud", label: "AUD — Australian dollar" },
  { code: "ttd", label: "TTD — Trinidad and Tobago dollar" },
  { code: "bbd", label: "BBD — Barbados dollar" },
] as const;

export type ShopCurrency = (typeof SHOP_CURRENCIES)[number]["code"];

export function isShopCurrency(value: string): value is ShopCurrency {
  return SHOP_CURRENCIES.some((row) => row.code === value);
}

/** Reference-only: shopCurrency units per 1 quoteCurrency unit. */
export function formatFxPreview(
  rate: number | null | undefined,
  quoteCurrency: string,
  shopCurrency: string,
): string | null {
  if (
    rate == null ||
    !Number.isFinite(rate) ||
    rate <= 0 ||
    quoteCurrency === shopCurrency
  ) {
    return null;
  }
  const q = quoteCurrency.toUpperCase();
  const s = shopCurrency.toUpperCase();
  const pretty = new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 6,
  }).format(rate);
  return `1 ${q} = ${pretty} ${s}`;
}
