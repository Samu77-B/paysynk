"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  rotateLoyaltyApiKey,
  saveLoyaltySettings,
} from "@/lib/dashboard/actions";

export function LoyaltySettings({
  loyaltyEnabled,
  loyaltyProductPtsPerPound,
  loyaltyServicePtsPerPound,
  loyaltyRedeemPtsPerPound,
  loyaltyApiKeyLast4,
  storeSlug,
}: {
  loyaltyEnabled: boolean;
  loyaltyProductPtsPerPound: number;
  loyaltyServicePtsPerPound: number;
  loyaltyRedeemPtsPerPound: number | null;
  loyaltyApiKeyLast4: string | null;
  storeSlug: string;
}) {
  const [enabled, setEnabled] = useState(loyaltyEnabled);
  const [productPts, setProductPts] = useState(String(loyaltyProductPtsPerPound));
  const [servicePts, setServicePts] = useState(String(loyaltyServicePtsPerPound));
  const [redeemPts, setRedeemPts] = useState(
    loyaltyRedeemPtsPerPound != null ? String(loyaltyRedeemPtsPerPound) : "",
  );
  const [last4, setLast4] = useState(loyaltyApiKeyLast4);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveLoyaltySettings({
        enabled,
        productPts: Number(productPts),
        servicePts: Number(servicePts),
        redeemPts: redeemPts.trim() ? Number(redeemPts) : null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEnabled(Boolean(result.loyaltyEnabled));
      if (typeof result.loyaltyProductPtsPerPound === "number") {
        setProductPts(String(result.loyaltyProductPtsPerPound));
      }
      if (typeof result.loyaltyServicePtsPerPound === "number") {
        setServicePts(String(result.loyaltyServicePtsPerPound));
      }
      setRedeemPts(
        result.loyaltyRedeemPtsPerPound != null
          ? String(result.loyaltyRedeemPtsPerPound)
          : "",
      );
      setMessage("Points club saved.");
    });
  }

  function rotate() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await rotateLoyaltyApiKey();
      if (result.error) {
        setError(result.error);
        return;
      }
      setFreshKey(result.apiKey ?? null);
      setLast4(result.last4 ?? null);
      setMessage("Copy this key into SalonSynk now. It is not shown again.");
    });
  }

  return (
    <div className="space-y-4 border-t border-zinc-200 pt-6">
      <div>
        <p className="text-sm font-medium">Points club</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          PaySynk holds the balance. Product orders earn automatically. SalonSynk
          reports paid services with the key below.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2">
        <div>
          <p className="text-sm font-medium">Turn on points</p>
          <p className="text-xs text-zinc-500">
            Checkout and the website join form offer the club.
          </p>
        </div>
        <Switch
          checked={enabled}
          disabled={pending}
          onCheckedChange={setEnabled}
          aria-label="Turn on points club"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="pts-product">Product pts / £</Label>
          <Input
            id="pts-product"
            type="number"
            min={0}
            max={100}
            value={productPts}
            onChange={(e) => setProductPts(e.target.value)}
          />
          <p className="text-xs text-zinc-500">JoJo default: 2</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="pts-service">Service pts / £</Label>
          <Input
            id="pts-service"
            type="number"
            min={0}
            max={100}
            value={servicePts}
            onChange={(e) => setServicePts(e.target.value)}
          />
          <p className="text-xs text-zinc-500">JoJo default: 1</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="pts-redeem">Pts for £1 off</Label>
          <Input
            id="pts-redeem"
            type="number"
            min={1}
            max={1000}
            placeholder="10"
            value={redeemPts}
            onChange={(e) => setRedeemPts(e.target.value)}
          />
          <p className="text-xs text-zinc-500">10 = 100 pts for £10. Redeem later.</p>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-zinc-200 p-3">
        <p className="text-sm font-medium">SalonSynk key</p>
        <p className="text-xs text-zinc-500">
          Put this on the booking app, not on the public Vercel site. Earn URL:{" "}
          <code className="rounded bg-zinc-100 px-1">
            /api/stores/{storeSlug}/loyalty/earn
          </code>
        </p>
        {last4 ? (
          <p className="text-sm text-zinc-700">
            Current key ends in <code>…{last4}</code>
          </p>
        ) : (
          <p className="text-sm text-zinc-500">No key yet — generate one.</p>
        )}
        {freshKey ? (
          <pre className="overflow-x-auto rounded-md bg-[#141414] p-3 text-xs text-[#9FE870]">
            {freshKey}
          </pre>
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={rotate}
        >
          {last4 ? "Replace key" : "Generate key"}
        </Button>
      </div>

      <Button
        type="button"
        onClick={save}
        disabled={pending}
        className="bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
      >
        {pending ? "Saving…" : "Save points club"}
      </Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </div>
  );
}
