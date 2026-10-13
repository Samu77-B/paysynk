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

export type FxRateMap = Record<string, number>;

export type PublicFxQuote = {
  code: ShopCurrency;
  minor: number;
  label: string;
};

function clampRate(n: number): number | null {
  if (!Number.isFinite(n) || n <= 0 || n > 1_000_000) return null;
  return Math.round(n * 1_000_000) / 1_000_000;
}

export function parseFxRates(raw: unknown): FxRateMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: FxRateMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const code = key.trim().toLowerCase();
    if (!isShopCurrency(code)) continue;
    const n = typeof value === "number" ? value : Number(value);
    const rate = clampRate(n);
    if (rate != null) out[code] = rate;
  }
  return out;
}

export function parseFxDisplayCurrencies(
  raw: unknown,
  shopCurrency: string,
): ShopCurrency[] {
  if (!Array.isArray(raw)) return [];
  const shop = shopCurrency.trim().toLowerCase();
  const seen = new Set<string>();
  const out: ShopCurrency[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const code = item.trim().toLowerCase();
    if (!isShopCurrency(code) || code === shop || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

/** shopMinor in shop currency → minor units of quote currency. rate = shop units per 1 quote unit. */
export function convertShopMinor(shopMinor: number, rate: number): number {
  const n = clampRate(rate);
  if (n == null) return 0;
  return Math.round(shopMinor / n);
}

export function formatMoneyCompact(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(minor / 100);
  } catch {
    return `${currency.toUpperCase()} ${(minor / 100).toFixed(2)}`;
  }
}

/** Extra amounts shown beside the shop price when those currencies are set to Show. */
export function publicConvertedPrices(
  shopMinor: number,
  shopCurrency: string,
  display: string[],
  rates: unknown,
): PublicFxQuote[] {
  const parsedRates = parseFxRates(rates);
  return parseFxDisplayCurrencies(display, shopCurrency)
    .map((code) => {
      const rate = parsedRates[code];
      if (rate == null) return null;
      const minor = convertShopMinor(shopMinor, rate);
      if (minor <= 0) return null;
      return { code, minor, label: formatMoneyCompact(minor, code) };
    })
    .filter((row): row is PublicFxQuote => row != null);
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
