"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { StoreBrand } from "@/components/storefront/StoreBrand";
import { CartProvider, useCart } from "@/lib/cart";
import { formatMoney, priceCart } from "@/lib/pricing";
import { imageForSelection } from "@/lib/product-images";
import type { PublicOffer } from "@/lib/offers";
import { parseCheckoutCustomer } from "@/lib/checkout-customer";
import { INTERNATIONAL_SHIPPING_COUNTRIES } from "@/lib/shipping-countries";

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
  logoUrl?: string | null;
  currency: string;
  shippingFlatMinor: number;
  shippingIntlMinor?: number | null;
  paymentsActive: boolean;
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

  const [zoom, setZoom] = useState(false);
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
      >
        {image ? (
          <button
            type="button"
            className="store-product-zoom"
            onClick={() => setZoom(true)}
            aria-label={`View larger photo of ${product.title}`}
          >
            <Image
              key={image}
              src={encodeURI(image)}
              alt={colour ? `${product.title} — ${colour}` : product.title}
              fill
              sizes="(min-width: 860px) 33vw, 90vw"
              unoptimized={image.startsWith("http")}
              className="store-product-img"
            />
          </button>
        ) : (
          <span>{productBadge(product)}</span>
        )}
      </div>
      {zoom && image
        ? createPortal(
            <div
              className="photo-zoom"
              role="dialog"
              aria-modal="true"
              onClick={() => setZoom(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={encodeURI(image)} alt={product.title} />
            </div>,
            document.body,
          )
        : null}
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

function CartPanel({
  store,
  offers,
}: {
  store: StorefrontStore;
  offers: PublicOffer[];
}) {
  const { items, setQuantity, removeItem, itemCount, clear } = useCart();
  const [discountCode, setDiscountCode] = useState("");
  const [codeDraft, setCodeDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const deliveryRef = useRef<HTMLFieldSetElement>(null);
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
    country: "GB",
  });

  function updateCustomer(field: keyof typeof customer, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  const shippingMinor =
    customer.country !== "GB" && typeof store.shippingIntlMinor === "number"
      ? store.shippingIntlMinor
      : store.shippingFlatMinor;

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
      shippingMinor,
      { offers, discountCode },
    );
  }, [items, shippingMinor, offers, discountCode]);

  async function checkout() {
    if (!items.length || busy) return;
    const fields = deliveryRef.current?.querySelectorAll("input, select");
    if (fields) {
      for (const el of fields) {
        if (
          (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) &&
          !el.checkValidity()
        ) {
          el.reportValidity();
          return;
        }
      }
    }
    const parsed = parseCheckoutCustomer(customer);
    if (!parsed.customer) {
      setCheckoutError(parsed.error || "Add your delivery details to continue.");
      return;
    }
    setBusy(true);
    setCheckoutError(null);
    try {
      const res = await fetch(`/api/stores/${store.slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          discountCode: discountCode || undefined,
          customer: parsed.customer,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        redirectUrl?: string;
      };
      if (!res.ok || !data.redirectUrl) {
        throw new Error(data.error || "Checkout failed");
      }
      clear();
      window.location.href = data.redirectUrl;
    } catch (err) {
      setBusy(false);
      setCheckoutError(
        err instanceof Error ? err.message : "Checkout failed",
      );
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
            {pricing.gifts.map((gift) => (
              <li key={gift.offerId} className="cart-gift">
                <div>
                  <strong>Free: {gift.title}</strong>
                  <div className="muted small">×{gift.quantity}</div>
                </div>
              </li>
            ))}
          </ul>

          <form
            className="cart-promo"
            onSubmit={(e) => {
              e.preventDefault();
              setDiscountCode(codeDraft);
            }}
          >
            <input
              type="text"
              value={codeDraft}
              onChange={(e) => setCodeDraft(e.target.value.toUpperCase())}
              placeholder="Discount code"
              aria-label="Discount code"
            />
            <button type="submit" className="btn btn-ghost">
              Apply
            </button>
          </form>
          {pricing.codeError && (
            <p className="muted small note" style={{ color: "#b91c1c" }}>
              {pricing.codeError}
            </p>
          )}

          <dl className="totals">
            <div>
              <dt>Items</dt>
              <dd>
                {formatMoney(pricing.catalogueSubtotalMinor, store.currency)}
              </dd>
            </div>
            {pricing.discountMinor > 0 && (
              <div>
                <dt>{pricing.discountLabel || "Discount"}</dt>
                <dd>
                  −{formatMoney(pricing.discountMinor, store.currency)}
                </dd>
              </div>
            )}
            <div>
              <dt>
                {customer.country === "GB"
                  ? "UK shipping"
                  : "International shipping"}
              </dt>
              <dd>{formatMoney(pricing.shippingMinor, store.currency)}</dd>
            </div>
            <div className="grand">
              <dt>Total</dt>
              <dd>{formatMoney(pricing.totalMinor, store.currency)}</dd>
            </div>
          </dl>

          <fieldset className="cart-delivery" ref={deliveryRef}>
            <legend>Delivery</legend>
            {typeof store.shippingIntlMinor === "number" ? (
              <div className="cart-dest">
                <label className={customer.country === "GB" ? "is-on" : ""}>
                  <input
                    type="radio"
                    name="dest"
                    checked={customer.country === "GB"}
                    onChange={() => updateCustomer("country", "GB")}
                  />
                  UK
                </label>
                <label className={customer.country !== "GB" ? "is-on" : ""}>
                  <input
                    type="radio"
                    name="dest"
                    checked={customer.country !== "GB"}
                    onChange={() =>
                      updateCustomer(
                        "country",
                        customer.country === "GB"
                          ? INTERNATIONAL_SHIPPING_COUNTRIES[0].code
                          : customer.country,
                      )
                    }
                  />
                  International
                </label>
              </div>
            ) : (
              <p className="muted small note">Ships to the UK.</p>
            )}
            {customer.country !== "GB" &&
            typeof store.shippingIntlMinor === "number" ? (
              <label>
                Country <span className="req" aria-hidden="true">*</span>
                <select
                  required
                  value={customer.country}
                  onChange={(e) => updateCustomer("country", e.target.value)}
                >
                  {INTERNATIONAL_SHIPPING_COUNTRIES.map((row) => (
                    <option key={row.code} value={row.code}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label>
              Full name <span className="req" aria-hidden="true">*</span>
              <input
                type="text"
                autoComplete="name"
                required
                value={customer.name}
                onChange={(e) => updateCustomer("name", e.target.value)}
              />
            </label>
            <label>
              Email <span className="req" aria-hidden="true">*</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={customer.email}
                onChange={(e) => updateCustomer("email", e.target.value)}
              />
            </label>
            <label>
              Phone (optional)
              <input
                type="tel"
                autoComplete="tel"
                value={customer.phone}
                onChange={(e) => updateCustomer("phone", e.target.value)}
              />
            </label>
            <label>
              Address line 1 <span className="req" aria-hidden="true">*</span>
              <input
                type="text"
                autoComplete="address-line1"
                required
                value={customer.line1}
                onChange={(e) => updateCustomer("line1", e.target.value)}
              />
            </label>
            <label>
              Address line 2 (optional)
              <input
                type="text"
                autoComplete="address-line2"
                value={customer.line2}
                onChange={(e) => updateCustomer("line2", e.target.value)}
              />
            </label>
            <div className="cart-delivery-row">
              <label>
                Town / city <span className="req" aria-hidden="true">*</span>
                <input
                  type="text"
                  autoComplete="address-level2"
                  required
                  value={customer.city}
                  onChange={(e) => updateCustomer("city", e.target.value)}
                />
              </label>
              <label>
                Postcode{customer.country === "GB" ? "" : " / ZIP"}{" "}
                <span className="req" aria-hidden="true">*</span>
                <input
                  type="text"
                  autoComplete="postal-code"
                  required
                  value={customer.postalCode}
                  onChange={(e) =>
                    updateCustomer("postalCode", e.target.value.toUpperCase())
                  }
                />
              </label>
            </div>
            <p className="muted small note">
              Stripe will show this address filled in, then take the card.
            </p>
          </fieldset>

          {store.paymentsActive ? (
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={busy}
              onClick={() => void checkout()}
            >
              {busy ? "Redirecting…" : "Checkout with Stripe"}
            </button>
          ) : (
            <p className="muted small note">
              Checkout stays off until you connect Stripe in Settings → Payments.
              You can still add items and check totals here.
            </p>
          )}
          {checkoutError && (
            <p className="muted small note" style={{ color: "#b91c1c" }}>
              {checkoutError}
            </p>
          )}
          <p className="muted small note">
            Prices and stock re-validated on the server at checkout.
          </p>
        </>
      )}
    </aside>
  );
}

export function Storefront({
  store,
  products,
  offers = [],
}: {
  store: StorefrontStore;
  products: StorefrontProduct[];
  offers?: PublicOffer[];
}) {
  return (
    <CartProvider storeSlug={store.slug}>
      <div className="store-shell">
        <header className="store-header">
          <div>
            <StoreBrand name={store.name} logoUrl={store.logoUrl} />
            <p className="muted" style={{ marginTop: "0.75rem" }}>
              Currency {store.currency.toUpperCase()} · UK shipping{" "}
              {formatMoney(store.shippingFlatMinor, store.currency)}
              {typeof store.shippingIntlMinor === "number"
                ? ` · International ${formatMoney(store.shippingIntlMinor, store.currency)}`
                : ""}
            </p>
            {!store.paymentsActive && (
              <p className="store-preview-note">
                Merch preview — customers will not see this shop or the cart
                until you connect Stripe in Settings → Payments and Activate.
              </p>
            )}
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
          <CartPanel store={store} offers={offers} />
        </div>
      </div>
    </CartProvider>
  );
}
