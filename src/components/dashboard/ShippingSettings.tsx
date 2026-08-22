"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/pricing";
import { saveShippingSettings } from "@/lib/dashboard/actions";

export function ShippingSettings({
  currency,
  shippingFlatMinor,
  shippingIntlMinor,
}: {
  currency: string;
  shippingFlatMinor: number;
  shippingIntlMinor: number | null;
}) {
  const [pounds, setPounds] = useState((shippingFlatMinor / 100).toFixed(2));
  const [offerIntl, setOfferIntl] = useState(shippingIntlMinor != null);
  const [intlPounds, setIntlPounds] = useState(
    ((shippingIntlMinor ?? 1200) / 100).toFixed(2),
  );
  const [savedUk, setSavedUk] = useState(shippingFlatMinor);
  const [savedIntl, setSavedIntl] = useState(shippingIntlMinor);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      setMessage(null);
      setError(null);
      const result = await saveShippingSettings({
        pounds,
        intlPounds,
        offerIntl,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (typeof result.shippingFlatMinor === "number") {
        setSavedUk(result.shippingFlatMinor);
        setPounds((result.shippingFlatMinor / 100).toFixed(2));
      }
      setSavedIntl(
        typeof result.shippingIntlMinor === "number"
          ? result.shippingIntlMinor
          : null,
      );
      setOfferIntl(result.shippingIntlMinor != null);
      setMessage("Delivery charges saved. New checkouts will use these amounts.");
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
        <Label htmlFor="shipping-pounds">
          UK delivery ({currency.toUpperCase()})
        </Label>
        <Input
          id="shipping-pounds"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={pounds}
          onChange={(e) => setPounds(e.target.value)}
        />
        <p className="text-xs text-zinc-500">
          Charged once per UK order. Use 0 for free UK delivery. Currently{" "}
          {formatMoney(savedUk, currency)}.
        </p>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={offerIntl}
            onChange={(e) => setOfferIntl(e.target.checked)}
          />
          Offer international delivery
        </label>
        {offerIntl && (
          <div className="space-y-1">
            <Label htmlFor="shipping-intl">
              International delivery ({currency.toUpperCase()})
            </Label>
            <Input
              id="shipping-intl"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={intlPounds}
              onChange={(e) => setIntlPounds(e.target.value)}
            />
            <p className="text-xs text-zinc-500">
              Charged instead of the UK rate when the customer chooses
              international. Currently{" "}
              {savedIntl == null ? "off" : formatMoney(savedIntl, currency)}.
            </p>
          </div>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save delivery charges"}
      </Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </form>
  );
}
