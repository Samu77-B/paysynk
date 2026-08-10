"use client";

import { useMemo, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { CartProvider, useCart } from "@/lib/cart";
import { formatMoney, priceCart } from "@/lib/pricing";

export type StorefrontProduct = {
  id: string;
  title: string;
  description: string;
  images: string[];
  kind: "tee" | "tote" | "other";
  variants: Array<{
    id: string;
    sku: string;
    options: Record<string, string>;
    priceMinor: number;
    stockQty: number;
  }>;
};

export type StorefrontStore = {
  slug: string;
  name: string;
  currency: string;
  shippingFlatMinor: number;
};

function optionLabel(options: Record<string, string>) {
  return Object.entries(options)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

function ProductCard({
  product,
  currency,
}: {
  product: StorefrontProduct;
  currency: string;
}) {
  const { addItem } = useCart();
  const colours = useMemo(() => {
    const set = new Set<string>();
    for (const v of product.variants) {
      if (v.options.colour) set.add(v.options.colour);
    }
    return Array.from(set);
  }, [product.variants]);

  const [colour, setColour] = useState(colours[0] ?? "");
  const sizesForColour = useMemo(() => {
    return product.variants.filter((v) =>
      colour ? v.options.colour === colour : true,
    );
  }, [product.variants, colour]);

  const [variantId, setVariantId] = useState(sizesForColour[0]?.id ?? "");
  const selected =
    product.variants.find((v) => v.id === variantId) ?? sizesForColour[0];

  return (
    <article className="store-product">
      <div className="store-product-visual" aria-hidden>
        <span>{product.kind === "tote" ? "Tote" : "Tee"}</span>
      </div>
      <div className="store-product-body">
        <h2>{product.title}</h2>
        <p className="muted">{product.description}</p>
        <p className="price">
          {formatMoney(product.variants[0]?.priceMinor ?? 0, currency)}
        </p>

        {colours.length > 0 && (
          <label className="field">
            <span>Colour</span>
            <select
              value={colour}
              onChange={(e) => {
                const next = e.target.value;
                setColour(next);
                const first = product.variants.find(
                  (v) => v.options.colour === next,
                );
                if (first) setVariantId(first.id);
              }}
            >
              {colours.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}

        {sizesForColour.some((v) => v.options.size) && (
          <label className="field">
            <span>Size</span>
            <select
              value={selected?.id ?? ""}
              onChange={(e) => setVariantId(e.target.value)}
            >
              {sizesForColour.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.options.size ?? v.sku} — {v.stockQty} left
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          className="btn btn-primary"
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            addItem({
              variantId: selected.id,
              productId: product.id,
              title: product.title,
              optionsLabel: optionLabel(selected.options as Record<string, string>),
              kind: product.kind,
              priceMinor: selected.priceMinor,
              maxStock: selected.stockQty,
            });
          }}
        >
          Add to cart
        </button>
      </div>
    </article>
  );
}

function CartPanel({ store }: { store: StorefrontStore }) {
  const { items, setQuantity, removeItem, clear, itemCount } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pricing = useMemo(() => {
    return priceCart(
      items.map((i) => ({
        variantId: i.variantId,
        productId: i.productId,
        title: i.title,
        kind: i.kind,
        options: {},
        sku: i.variantId,
        catalogueUnitMinor: i.priceMinor,
        quantity: i.quantity,
      })),
      store.shippingFlatMinor,
    );
  }, [items, store.shippingFlatMinor]);

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${store.slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      clear();
      window.location.href = data.redirectUrl as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setBusy(false);
    }
  }

  return (
    <aside className="store-cart">
      <h2>Cart ({itemCount})</h2>
      {items.length === 0 ? (
        <p className="muted">Your cart is empty.</p>
      ) : (
        <>
          <ul className="cart-lines">
            {items.map((item) => (
              <li key={item.variantId}>
                <div>
                  <strong>{item.title}</strong>
                  {item.optionsLabel && (
                    <div className="muted small">{item.optionsLabel}</div>
                  )}
                  <div className="muted small">
                    {formatMoney(item.priceMinor, store.currency)} each
                  </div>
                </div>
                <div className="cart-qty">
                  <input
                    type="number"
                    min={1}
                    max={item.maxStock}
                    value={item.quantity}
                    onChange={(e) =>
                      setQuantity(item.variantId, Number(e.target.value))
                    }
                  />
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => removeItem(item.variantId)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <dl className="totals">
            <div>
              <dt>Items</dt>
              <dd>
                {formatMoney(pricing.catalogueSubtotalMinor, store.currency)}
              </dd>
            </div>
            {pricing.bundlePairs > 0 && (
              <div>
                <dt>Bundle ({pricing.bundlePairs}× tee + tote → £20)</dt>
                <dd>−{formatMoney(pricing.discountMinor, store.currency)}</dd>
              </div>
            )}
            <div>
              <dt>UK shipping</dt>
              <dd>{formatMoney(pricing.shippingMinor, store.currency)}</dd>
            </div>
            <div className="grand">
              <dt>Total</dt>
              <dd>{formatMoney(pricing.totalMinor, store.currency)}</dd>
            </div>
          </dl>

          {error && <p className="error">{error}</p>}

          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={busy}
            onClick={checkout}
          >
            {busy ? "Redirecting…" : "Checkout with Stripe"}
          </button>
          <p className="muted small note">
            Prices re-validated on the server. Bundle: tee + tote = £20.
          </p>
        </>
      )}
    </aside>
  );
}

export function Storefront({
  store,
  products,
}: {
  store: StorefrontStore;
  products: StorefrontProduct[];
}) {
  return (
    <CartProvider storeSlug={store.slug}>
      <div className="store-shell">
        <header className="store-header">
          <div>
            <a href="/" aria-label="PaySynk home">
              <BrandLogo variant="white" height={28} />
            </a>
            <p className="eyebrow accent-text" style={{ marginTop: "1rem" }}>
              Hosted storefront
            </p>
            <h1>{store.name}</h1>
            <p className="muted">
              Currency {store.currency.toUpperCase()} · UK shipping{" "}
              {formatMoney(store.shippingFlatMinor, store.currency)}
            </p>
          </div>
          <a className="btn btn-ghost" href="/">
            PaySynk home
          </a>
        </header>

        <div className="store-layout">
          <div className="store-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} currency={store.currency} />
            ))}
          </div>
          <CartPanel store={store} />
        </div>
      </div>
    </CartProvider>
  );
}
