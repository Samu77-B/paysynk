"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { saveStoreIdentitySettings } from "@/lib/dashboard/actions";
import {
  SHOP_CURRENCIES,
  parseFxDisplayCurrencies,
  parseFxRates,
  type ShopCurrency,
} from "@/lib/shop-currency";

type FxRow = { code: ShopCurrency; show: boolean; rate: string };

function rowsFromSaved(opts: {
  shopCurrency: string;
  fxQuoteCurrency: string;
  exchangeRate: number | null;
  fxDisplayCurrencies: string[];
  fxRates: unknown;
}): FxRow[] {
  const shop = opts.shopCurrency.toLowerCase();
  const rates = parseFxRates(opts.fxRates);
  if (
    opts.exchangeRate != null &&
    isListed(opts.fxQuoteCurrency) &&
    opts.fxQuoteCurrency.toLowerCase() !== shop &&
    rates[opts.fxQuoteCurrency.toLowerCase()] == null
  ) {
    rates[opts.fxQuoteCurrency.toLowerCase()] = opts.exchangeRate;
  }
  const shown = new Set(
    parseFxDisplayCurrencies(opts.fxDisplayCurrencies, shop),
  );
  return SHOP_CURRENCIES.filter((row) => row.code !== shop).map((row) => ({
    code: row.code,
    show: shown.has(row.code),
    rate: rates[row.code] != null ? String(rates[row.code]) : "",
  }));
}

function isListed(code: string): code is ShopCurrency {
  return SHOP_CURRENCIES.some((row) => row.code === code.toLowerCase());
}

export function StoreIdentitySettings({
  name,
  slug,
  currency,
  fxQuoteCurrency,
  exchangeRate,
  fxDisplayCurrencies,
  fxRates,
}: {
  name: string;
  slug: string;
  currency: string;
  fxQuoteCurrency: string;
  exchangeRate: number | null;
  fxDisplayCurrencies: string[];
  fxRates: unknown;
}) {
  const router = useRouter();
  const [shopName, setShopName] = useState(name);
  const [shopCurrency, setShopCurrency] = useState(currency.toLowerCase());
  const [fxRows, setFxRows] = useState<FxRow[]>(() =>
    rowsFromSaved({
      shopCurrency: currency,
      fxQuoteCurrency,
      exchangeRate,
      fxDisplayCurrencies,
      fxRates,
    }),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visibleRows = useMemo(
    () => fxRows.filter((row) => row.code !== shopCurrency),
    [fxRows, shopCurrency],
  );

  function setShopCurrencyAndRows(next: string) {
    setShopCurrency(next);
    setFxRows((prev) => {
      const kept = new Map(prev.map((row) => [row.code, row]));
      return SHOP_CURRENCIES.filter((row) => row.code !== next).map((row) => {
        const existing = kept.get(row.code);
        return existing ?? { code: row.code, show: false, rate: "" };
      });
    });
  }

  function patchRow(code: ShopCurrency, partial: Partial<FxRow>) {
    setFxRows((prev) =>
      prev.map((row) => (row.code === code ? { ...row, ...partial } : row)),
    );
  }

  function save() {
    startTransition(async () => {
      setMessage(null);
      setError(null);
      const shown = visibleRows.filter((row) => row.show);
      const result = await saveStoreIdentitySettings({
        name: shopName,
        currency: shopCurrency,
        fxQuoteCurrency: shown[0]?.code ?? shopCurrency,
        exchangeRate: shown[0]?.rate ?? "",
        fxDisplayCurrencies: shown.map((row) => row.code),
        fxRates: Object.fromEntries(
          visibleRows
            .filter((row) => row.rate.trim())
            .map((row) => [row.code, row.rate]),
        ),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.name) setShopName(result.name);
      if (result.currency) setShopCurrency(result.currency);
      if (result.fxDisplayCurrencies && result.fxRates) {
        setFxRows(
          rowsFromSaved({
            shopCurrency: result.currency ?? shopCurrency,
            fxQuoteCurrency: result.fxQuoteCurrency ?? shopCurrency,
            exchangeRate: result.exchangeRate ?? null,
            fxDisplayCurrencies: result.fxDisplayCurrencies,
            fxRates: result.fxRates,
          }),
        );
      }
      setMessage("Shop name and currency saved.");
      router.refresh();
    });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="shop-name">Shop name</Label>
        <Input
          id="shop-name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          maxLength={80}
        />
        <p className="text-xs text-zinc-500">
          Shown on the storefront, receipts, and this dashboard. The public URL
          stays <code className="rounded bg-zinc-100 px-1">/s/{slug}</code>.
        </p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="shop-currency">Shop currency</Label>
        <select
          id="shop-currency"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          value={shopCurrency}
          onChange={(e) => setShopCurrencyAndRows(e.target.value)}
        >
          {SHOP_CURRENCIES.map((row) => (
            <option key={row.code} value={row.code}>
              {row.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500">
          Checkout, product prices, and delivery use this. Changing it does not
          convert existing amounts — 10.00 stays 10.00 in the new currency
          until you edit prices. This amount always shows on the public shop.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Converted prices on the public shop</Label>
        <p className="text-xs text-zinc-500">
          Optional. Turn a currency to Show and enter how many{" "}
          {shopCurrency.toUpperCase()} equal 1 of that currency. Customers still
          pay in {shopCurrency.toUpperCase()}.
        </p>
        <div className="space-y-2">
          {visibleRows.map((row) => {
            const meta = SHOP_CURRENCIES.find((c) => c.code === row.code);
            return (
              <div
                key={row.code}
                className="grid gap-2 rounded-lg border border-zinc-200 px-3 py-2 sm:grid-cols-[1fr_auto_9rem] sm:items-center"
              >
                <p className="text-sm">{meta?.label ?? row.code.toUpperCase()}</p>
                <label className="flex items-center justify-between gap-2 text-xs text-zinc-600 sm:justify-end">
                  <span>{row.show ? "Show" : "Hide"}</span>
                  <Switch
                    checked={row.show}
                    onCheckedChange={(show) => patchRow(row.code, { show })}
                  />
                </label>
                <Input
                  inputMode="decimal"
                  placeholder={`${shopCurrency.toUpperCase()} per 1 ${row.code.toUpperCase()}`}
                  value={row.rate}
                  onChange={(e) => patchRow(row.code, { rate: e.target.value })}
                  disabled={!row.show}
                />
              </div>
            );
          })}
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save shop name and currency"}
      </Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </form>
  );
}
