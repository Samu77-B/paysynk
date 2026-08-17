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
}: {
  currency: string;
  shippingFlatMinor: number;
}) {
  const [pounds, setPounds] = useState((shippingFlatMinor / 100).toFixed(2));
  const [savedMinor, setSavedMinor] = useState(shippingFlatMinor);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      setMessage(null);
      setError(null);
      const result = await saveShippingSettings({ pounds });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (typeof result.shippingFlatMinor === "number") {
        setSavedMinor(result.shippingFlatMinor);
        setPounds((result.shippingFlatMinor / 100).toFixed(2));
      }
      setMessage("Delivery charge saved. New checkouts will use this amount.");
    });
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="shipping-pounds">
          Delivery charge ({currency.toUpperCase()})
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
          Charged once per order at checkout. Use 0 for free delivery. Currently{" "}
          {formatMoney(savedMinor, currency)}.
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save delivery charge"}
      </Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </form>
  );
}
