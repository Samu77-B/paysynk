"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveStoreIdentitySettings } from "@/lib/dashboard/actions";
import {
  SHOP_CURRENCIES,
  formatFxPreview,
} from "@/lib/shop-currency";

export function StoreIdentitySettings({
  name,
  slug,
  currency,
  fxQuoteCurrency,
  exchangeRate,
}: {
  name: string;
  slug: string;
  currency: string;
  fxQuoteCurrency: string;
  exchangeRate: number | null;
}) {
  const router = useRouter();
  const [shopName, setShopName] = useState(name);
  const [shopCurrency, setShopCurrency] = useState(currency.toLowerCase());
  const [quoteCurrency, setQuoteCurrency] = useState(
    fxQuoteCurrency.toLowerCase(),
  );
  const [rate, setRate] = useState(
    exchangeRate != null && Number.isFinite(exchangeRate)
      ? String(exchangeRate)
      : "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const preview = formatFxPreview(
    Number(rate) || null,
    quoteCurrency,
    shopCurrency,
  );

  function save() {
    startTransition(async () => {
      setMessage(null);
      setError(null);
      const result = await saveStoreIdentitySettings({
        name: shopName,
        currency: shopCurrency,
        fxQuoteCurrency: quoteCurrency,
        exchangeRate: rate,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.name) setShopName(result.name);
      if (result.currency) setShopCurrency(result.currency);
      if (result.fxQuoteCurrency) setQuoteCurrency(result.fxQuoteCurrency);
      setRate(
        result.exchangeRate != null ? String(result.exchangeRate) : "",
      );
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="shop-currency">Shop currency</Label>
          <select
            id="shop-currency"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            value={shopCurrency}
            onChange={(e) => setShopCurrency(e.target.value)}
          >
            {SHOP_CURRENCIES.map((row) => (
              <option key={row.code} value={row.code}>
                {row.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">
            Checkout, product prices, and delivery use this. Changing it does
            not convert existing amounts — 10.00 stays 10.00 in the new
            currency until you edit prices.
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="fx-quote">Exchange rate quoted in</Label>
          <select
            id="fx-quote"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            value={quoteCurrency}
            onChange={(e) => setQuoteCurrency(e.target.value)}
          >
            {SHOP_CURRENCIES.map((row) => (
              <option key={row.code} value={row.code}>
                {row.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="fx-rate">
          Rate (optional) — how many {shopCurrency.toUpperCase()} per 1{" "}
          {quoteCurrency.toUpperCase()}
        </Label>
        <Input
          id="fx-rate"
          inputMode="decimal"
          placeholder="e.g. 198.50"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          disabled={quoteCurrency === shopCurrency}
        />
        <p className="text-xs text-zinc-500">
          A note for you when costing in another currency. Customers still pay
          in {shopCurrency.toUpperCase()}. Stripe/PayPal must support that
          currency on your account.
          {preview ? ` ${preview}.` : null}
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save shop name and currency"}
      </Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </form>
  );
}
