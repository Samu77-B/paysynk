"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StoreBrand } from "@/components/storefront/StoreBrand";
import { CartProvider, useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/pricing";
import { priceConfigSelection } from "@/lib/config-products/pricing";
import { configPreviewFromSelection } from "@/lib/config-products/preview";
import type { ConfigProductForPrice } from "@/lib/config-products/pricing";

export type PublicConfigProduct = ConfigProductForPrice & {
  slug: string;
  related: Array<{
    id: string;
    slug: string;
    title: string;
    images: string[];
  }>;
};

export function ConfigProductPage({
  store,
  product,
}: {
  store: {
    slug: string;
    name: string;
    logoUrl?: string | null;
    currency: string;
    paymentsActive: boolean;
  };
  product: PublicConfigProduct;
}) {
  return (
    <CartProvider storeSlug={store.slug}>
      <ConfigProductBuilder store={store} product={product} />
    </CartProvider>
  );
}

function ConfigProductBuilder({
  store,
  product,
}: {
  store: {
    slug: string;
    name: string;
    logoUrl?: string | null;
    currency: string;
    paymentsActive: boolean;
  };
  product: PublicConfigProduct;
}) {
  const { addItem, itemCount } = useCart();
  const options = [...product.options].sort((a, b) => a.sort - b.sort);
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const start: Record<string, string> = {};
    for (const option of options) {
      if (option.required && option.values[0]) {
        start[option.id] = option.values[0].id;
      }
    }
    return start;
  });
  const [files, setFiles] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const priced = useMemo(
    () => priceConfigSelection(product, selections),
    [product, selections],
  );
  const preview = useMemo(
    () => configPreviewFromSelection(product, selections),
    [product, selections],
  );

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setUploadError(null);
    for (const file of Array.from(list)) {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch(
        `/api/stores/${store.slug}/config-uploads`,
        { method: "POST", body },
      );
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setUploadError(json.error || "Could not upload that file.");
        return;
      }
      setFiles((prev) => [...prev, json.url!]);
    }
  }

  return (
    <div className="store-shell config-page">
      <header className="store-header">
        <div>
          <StoreBrand name={store.name} logoUrl={store.logoUrl} />
          <p className="muted" style={{ marginTop: "0.5rem" }}>
            <Link href={`/s/${store.slug}`}>Back to catalog</Link>
          </p>
        </div>
        <Link className="btn btn-ghost" href={`/s/${store.slug}`}>
          Cart ({itemCount})
        </Link>
      </header>

      <div className="config-layout">
        <div>
          <div className="store-product-visual store-product-visual-photo config-hero">
            {preview.fallbackUrl || preview.layers.length ? (
              <>
                {preview.fallbackUrl ? (
                  <Image
                    src={preview.fallbackUrl}
                    alt={product.title}
                    fill
                    className="store-product-img config-hero-layer"
                    sizes="(min-width: 860px) 50vw, 90vw"
                    priority
                  />
                ) : null}
                {preview.layers.map((layer, index) => (
                  <Image
                    key={`${layer.optionName}-${layer.url}`}
                    src={layer.url}
                    alt={layer.label}
                    fill
                    className="store-product-img config-hero-layer"
                    style={{ zIndex: index + 2 }}
                    sizes="(min-width: 860px) 50vw, 90vw"
                  />
                ))}
              </>
            ) : (
              <span>Print</span>
            )}
            {preview.caption ? (
              <p className="config-hero-caption">{preview.caption}</p>
            ) : null}
          </div>
          {product.description ? (
            <div className="config-details">
              <h2>Product Details</h2>
              <p>{product.description}</p>
            </div>
          ) : null}
          {product.related.length > 0 ? (
            <div className="config-related">
              <h2>You may also like</h2>
              <div className="config-related-grid">
                {product.related.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/s/${store.slug}/p/${rel.slug}`}
                    className="config-related-card"
                  >
                    <span>{rel.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <form
          className="config-builder"
          onSubmit={(e) => {
            e.preventDefault();
            if (!priced.ok) return;
            addItem(
              {
                variantId: null,
                productId: product.id,
                configProductId: product.id,
                title: product.title,
                optionsLabel: priced.optionsLabel,
                kind: "other",
                priceMinor: priced.priceMinor,
                maxStock: 99,
                selections,
                files,
                instructions,
              },
              1,
            );
            setAdded(true);
          }}
        >
          <h1>{product.title}</h1>
          {product.sku ? (
            <p className="muted small">SKU {product.sku}</p>
          ) : null}
          <p className="config-price">
            {priced.ok
              ? formatMoney(priced.priceMinor, store.currency)
              : formatMoney(0, store.currency)}
          </p>
          {!priced.ok ? (
            <p className="muted small">{priced.error}</p>
          ) : null}

          {options.map((option) => {
            const selected = option.values.find(
              (value) => value.id === selections[option.id],
            );
            return (
              <label key={option.id} className="field">
                <span>
                  {option.name}
                  {option.required ? " *" : ""}
                </span>
                <span className="config-option-row">
                  {selected?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.imageUrl}
                      alt=""
                      className="config-option-thumb"
                    />
                  ) : null}
                  <select
                    required={option.required}
                    value={selections[option.id] ?? ""}
                    onChange={(e) =>
                      setSelections((cur) => ({
                        ...cur,
                        [option.id]: e.target.value,
                      }))
                    }
                  >
                    {!option.required ? (
                      <option value="">Please choose</option>
                    ) : null}
                    {option.values.map((value) => (
                      <option key={value.id} value={value.id}>
                        {value.label}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            );
          })}

          {product.uploadsEnabled ? (
            <div className="field">
              <span>Upload your files</span>
              <input
                type="file"
                multiple
                onChange={(e) => void onFiles(e.target.files)}
              />
              {files.length > 0 ? (
                <p className="muted small">{files.length} file(s) attached</p>
              ) : null}
              {uploadError ? (
                <p className="field-error">{uploadError}</p>
              ) : null}
            </div>
          ) : null}

          {product.instructionsEnabled ? (
            <label className="field">
              <span>Any further instructions?</span>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </label>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!priced.ok || !store.paymentsActive}
          >
            Add to Bag
          </button>
          {added ? (
            <p className="muted small">
              Added. <Link href={`/s/${store.slug}`}>View cart</Link>
            </p>
          ) : null}
          {!store.paymentsActive ? (
            <p className="muted small">
              Checkout is off until payments are activated.
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
