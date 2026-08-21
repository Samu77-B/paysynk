"use client";

import { useState, useTransition } from "react";
import { Percent, Gift, Layers, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatGbp } from "@/lib/dashboard/demo-data";
import {
  deleteOffer,
  saveBundleOffer,
  saveCodeOffer,
  saveGiftOffer,
  setOfferActive,
} from "@/lib/dashboard/offer-actions";
import type { CatalogProduct, DashboardOffer } from "@/lib/dashboard/data";

function productTitle(products: CatalogProduct[], id: string | null) {
  if (!id) return "—";
  return products.find((p) => p.id === id)?.title ?? "Deleted product";
}

function offerSummary(offer: DashboardOffer, products: CatalogProduct[]) {
  if (offer.kind === "code") {
    const value =
      offer.discountKind === "percent"
        ? `${offer.discountValue}% off`
        : `${formatGbp(offer.discountValue ?? 0)} off`;
    const min = offer.minSubtotalMinor
      ? ` · min ${formatGbp(offer.minSubtotalMinor)}`
      : "";
    return `${offer.code} · ${value}${min}`;
  }
  if (offer.kind === "bundle") {
    return `${productTitle(products, offer.productIdA)} + ${productTitle(products, offer.productIdB)} · ${formatGbp(offer.bundleOffMinor ?? 0)} off each pair`;
  }
  const mode =
    offer.giftMode === "per_order"
      ? "one per order"
      : "one with every product";
  return `${offer.giftTitle || productTitle(products, offer.giftProductId)} · ${mode}`;
}

export function OffersManager({
  products,
  initialOffers,
}: {
  products: CatalogProduct[];
  initialOffers: DashboardOffer[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [codeTitle, setCodeTitle] = useState("Summer sale");
  const [code, setCode] = useState("");
  const [codeKind, setCodeKind] = useState<"percent" | "amount">("percent");
  const [codeValue, setCodeValue] = useState("10");
  const [minSpend, setMinSpend] = useState("");

  const [bundleTitle, setBundleTitle] = useState("Tee + bag");
  const [productA, setProductA] = useState(products[0]?.id ?? "");
  const [productB, setProductB] = useState(products[1]?.id ?? "");
  const [bundleOff, setBundleOff] = useState("3");

  const [giftTitle, setGiftTitle] = useState("Free sticker");
  const [giftProductId, setGiftProductId] = useState("");
  const [giftMode, setGiftMode] = useState<"per_item" | "per_order">("per_item");

  const selectClass =
    "h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm";

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Offers</h1>
        <p className="text-sm text-zinc-500">
          Discount codes, buy-together bundles, and a free gift with purchase.
          The shop cart applies these; checkout re-checks them on the server.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="size-4" />
              Discount code
            </CardTitle>
            <CardDescription>
              Shoppers type this at checkout, e.g. SUMMER10.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="code-title">Label</Label>
              <Input
                id="code-title"
                value={codeTitle}
                onChange={(e) => setCodeTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="code-value">Code</Label>
              <Input
                id="code-value"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SUMMER10"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="code-kind">Type</Label>
                <select
                  id="code-kind"
                  className={selectClass}
                  value={codeKind}
                  onChange={(e) =>
                    setCodeKind(e.target.value as "percent" | "amount")
                  }
                >
                  <option value="percent">Percent off</option>
                  <option value="amount">£ off</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="code-amount">
                  {codeKind === "percent" ? "% off" : "£ off"}
                </Label>
                <Input
                  id="code-amount"
                  inputMode="decimal"
                  value={codeValue}
                  onChange={(e) => setCodeValue(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="code-min">Minimum spend (optional)</Label>
              <Input
                id="code-min"
                inputMode="decimal"
                placeholder="0"
                value={minSpend}
                onChange={(e) => setMinSpend(e.target.value)}
              />
            </div>
            <Button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() =>
                  saveCodeOffer({
                    title: codeTitle,
                    code,
                    discountKind: codeKind,
                    percentOrPounds: codeValue,
                    minSpendPounds: minSpend,
                  }),
                )
              }
            >
              Add code
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="size-4" />
              Bundle
            </CardTitle>
            <CardDescription>
              Buy a t-shirt with a bag — take £ off each matching pair.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="bundle-title">Label</Label>
              <Input
                id="bundle-title"
                value={bundleTitle}
                onChange={(e) => setBundleTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bundle-a">Product A</Label>
              <select
                id="bundle-a"
                className={selectClass}
                value={productA}
                onChange={(e) => setProductA(e.target.value)}
              >
                <option value="">Select…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="bundle-b">Product B</Label>
              <select
                id="bundle-b"
                className={selectClass}
                value={productB}
                onChange={(e) => setProductB(e.target.value)}
              >
                <option value="">Select…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="bundle-off">£ off per pair</Label>
              <Input
                id="bundle-off"
                inputMode="decimal"
                value={bundleOff}
                onChange={(e) => setBundleOff(e.target.value)}
              />
            </div>
            <Button
              type="button"
              disabled={pending || products.length < 2}
              onClick={() =>
                run(() =>
                  saveBundleOffer({
                    title: bundleTitle,
                    productIdA: productA,
                    productIdB: productB,
                    offPounds: bundleOff,
                  }),
                )
              }
            >
              Add bundle
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="size-4" />
              Free gift
            </CardTitle>
            <CardDescription>
              Add a sticker (or any product) at £0. Pick the item they
              receive for free — not the tee they are buying. Hide that
              product in Products if you do not want people to buy it on
              its own.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="gift-title">Label</Label>
              <Input
                id="gift-title"
                value={giftTitle}
                onChange={(e) => setGiftTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gift-product">Gift product</Label>
              <select
                id="gift-product"
                className={selectClass}
                value={giftProductId}
                onChange={(e) => setGiftProductId(e.target.value)}
              >
                <option value="">Select…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                    {p.is_active ? "" : " (hidden)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="gift-mode">When</Label>
              <select
                id="gift-mode"
                className={selectClass}
                value={giftMode}
                onChange={(e) =>
                  setGiftMode(e.target.value as "per_item" | "per_order")
                }
              >
                <option value="per_item">One with every product bought</option>
                <option value="per_order">One per order</option>
              </select>
            </div>
            <Button
              type="button"
              disabled={pending || products.length < 1}
              onClick={() =>
                run(() =>
                  saveGiftOffer({
                    title: giftTitle,
                    giftProductId,
                    giftMode,
                  }),
                )
              }
            >
              Add gift
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live offers</CardTitle>
          <CardDescription>
            Pause an offer to stop it at checkout without deleting it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialOffers.length === 0 ? (
            <p className="text-sm text-zinc-500">No offers yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offer</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>On</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialOffers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div className="font-medium">{offer.title}</div>
                      <Badge variant="secondary" className="mt-1 capitalize">
                        {offer.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {offerSummary(offer, products)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={offer.active}
                        disabled={pending}
                        onCheckedChange={(checked) =>
                          run(() => setOfferActive(offer.id, checked))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Delete offer"
                        disabled={pending}
                        onClick={() => {
                          if (
                            window.confirm(`Delete “${offer.title}”?`)
                          ) {
                            run(() => deleteOffer(offer.id));
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
