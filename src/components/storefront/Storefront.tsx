"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { BrandLogo } from "@/components/BrandLogo";
import { CartProvider, useCart } from "@/lib/cart";
import { formatMoney, priceCart } from "@/lib/pricing";
import { imageForSelection } from "@/lib/product-images";

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
    imageUrl?: string | null;
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

function productBadge(product: StorefrontProduct) {
  const title = product.title.toLowerCase();
  if (title.includes("hoodie")) return "Hoodie";
  if (title.includes("bottle")) return "Bottle";
  if (title.includes("mug")) return "Mugs";
  if (product.kind === "tote") return "Tote";
  if (product.kind === "tee") return "Tee";
  return "Item";
}

function ProductCard({
  product,
  currency,
}: {
  product: StorefrontProduct;
  currency: string;
}) {
  const { addItem, items } = useCart();
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

  const cartQty = selected
    ? (items.find((i) => i.variantId === selected.id)?.quantity ?? 0)
    : 0;
  const available = selected ? Math.max(0, selected.stockQty - cartQty) : 0;
  const hasSizes = sizesForColour.some((v) => v.options.size);

  function remainingFor(variantId: string, stockQty: number) {
    const reserved =
      items.find((i) => i.variantId === variantId)?.quantity ?? 0;
    return Math.max(0, stockQty - reserved);
  }

  const image = imageForSelection(product, colour, selected);

  function stockPillClass(qty: number) {
    if (qty <= 0) return "stock-pill stock-pill-out";
    if (qty <= 10) return "stock-pill stock-pill-low";
    return "stock-pill";
  }

  return (
    <article className="store-product">
      <div
        className={`store-product-visual${image ? " store-product-visual-photo" : ""}`}
        aria-hidden={!image}
      >
        {image ? (
          <Image
            key={image}
            src={encodeURI(image)}
            alt={colour ? `${product.title} — ${colour}` : product.title}
            fill
            sizes="(min-width: 860px) 33vw, 90vw"
            className="store-product-img"
          />
        ) : (
          <span>{productBadge(product)}</span>
        )}
      </div>
      <div className="store-product-body">
        <h2>{product.title}</h2>
        <p className="muted">{product.description}</p>
        <p className="price">
          {formatMoney(product.variants[0]?.priceMinor ?? 0, currency)}
        </p>
        <span className={stockPillClass(available)}>
          <span className="stock-pill-count">{available}</span>
          {available <= 0 ? "out-of-stock" : "in-stock"}
        </span>

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
              {colours.map((c) => {
                const colourVariants = product.variants.filter(
                  (v) => v.options.colour === c,
                );
                const colourLeft = colourVariants.reduce(
                  (sum, v) => sum + remainingFor(v.id, v.stockQty),
                  0,
                );
                return (
                  <option key={c} value={c}>
                    {hasSizes ? c : `${c} — ${colourLeft} left`}
                  </option>
                );
              })}
            </select>
          </label>
        )}

        {hasSizes && (
          <label className="field">
            <span>Size</span>
            <select
              value={selected?.id ?? ""}
              onChange={(e) => setVariantId(e.target.value)}
            >
              {sizesForColour.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.options.size ?? v.sku} —{" "}
                  {remainingFor(v.id, v.stockQty)} left
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          className="btn btn-primary"
          disabled={!selected || available <= 0}
          onClick={() => {
            if (!selected || available <= 0) return;
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
          {available <= 0 ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}

function CartPanel({ store }: { store: StorefrontStore }) {
  const { items, setQuantity, removeItem, itemCount } = useCart();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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
            <div>
              <dt>UK shipping</dt>
              <dd>{formatMoney(pricing.shippingMinor, store.currency)}</dd>
            </div>
            <div className="grand">
              <dt>Total</dt>
              <dd>{formatMoney(pricing.totalMinor, store.currency)}</dd>
            </div>
          </dl>

          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => setShowPaymentModal(true)}
          >
            Checkout
          </button>
          <p className="muted small note">
            Prices and stock re-validated on the server at checkout.
          </p>
        </>
      )}

      {showPaymentModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
          onClick={() => setShowPaymentModal(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 id="payment-modal-title">
              No payment provider connected (Demo Only)
            </h3>
            <p className="muted">
              Connect to Stripe, PayPal, or Bank transfer (if available) to
              enable checkout for this store.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowPaymentModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
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
