"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Plus, Package, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CopySnippetButton,
  productEmbedSnippet,
} from "@/components/dashboard/embed-snippets";
import { formatGbp } from "@/lib/dashboard/demo-data";
import { saveDashboardProduct, deleteDashboardProduct } from "@/lib/dashboard/actions";
import { compressProductImage } from "@/lib/compress-image";
import type { CatalogProduct } from "@/lib/dashboard/data";

type FormState = {
  id?: string;
  title: string;
  description: string;
  price: string;
  compareAt: string;
  sku: string;
  stock: string;
  category: string;
  tags: string;
  isActive: boolean;
  enableVariants: boolean;
  variantSize: string;
  variantColor: string;
  defaultImage: string;
  colourImages: Record<string, string>;
  stockByKey: Record<string, string>;
};

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  price: "",
  compareAt: "",
  sku: "",
  stock: "0",
  category: "",
  tags: "",
  isActive: true,
  enableVariants: false,
  variantSize: "S,M,L",
  variantColor: "",
  defaultImage: "",
  colourImages: {},
  stockByKey: {},
});

function parseList(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function unique(values: (string | undefined)[]) {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v))));
}

function stockKey(colour?: string, size?: string) {
  return `${colour ?? ""}|${size ?? ""}`;
}

function merchCategoryLabel(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || "Uncategorised";
}

function productThumb(product: CatalogProduct) {
  return (
    product.images[0] ||
    product.variants.find((v) => v.imageUrl)?.imageUrl ||
    ""
  );
}

function ImagePicker({
  label,
  hint,
  url,
  onUrl,
}: {
  label: string;
  hint?: string;
  url: string;
  onUrl: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const compressed = await compressProductImage(file);
      const body = new FormData();
      body.set("file", compressed);
      const res = await fetch("/api/uploads/product-image", {
        method: "POST",
        body,
      });
      const text = await res.text();
      let data: { url?: string; error?: string } = {};
      try {
        data = JSON.parse(text) as { url?: string; error?: string };
      } catch {
        data = {};
      }
      if (!res.ok || !data.url) {
        setErr(
          data.error ??
            (res.status === 413
              ? "Image is too large. Use a JPG under 4MB."
              : `Upload failed (${res.status}).`),
        );
        return;
      }
      onUrl(data.url);
    } catch (err) {
      setErr(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 space-y-1.5">
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
          {url ? (
            <Image
              src={url}
              alt=""
              width={48}
              height={48}
              unoptimized={url.startsWith("http")}
              className="size-12 object-cover"
            />
          ) : (
            <Package className="size-4 text-zinc-400" />
          )}
        </div>
        <div className="min-w-0 space-y-1">
          <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50">
            {busy ? "Uploading…" : url ? "Change photo" : "Choose photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={busy}
              className="sr-only"
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {err ? <p className="text-xs text-red-600">{err}</p> : null}
          {url ? (
            <button
              type="button"
              className="block text-xs text-zinc-500 underline"
              onClick={() => onUrl("")}
            >
              Remove photo
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ProductsManager({
  storeSlug,
  initialProducts,
  paymentsActive,
}: {
  merchantId: string;
  storeSlug: string;
  initialProducts: CatalogProduct[];
  paymentsActive: boolean;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (form.id ? "Edit product" : "Add product"),
    [form.id],
  );

  const colours = form.enableVariants ? parseList(form.variantColor) : [];
  const sizes = form.enableVariants ? parseList(form.variantSize) : [];
  const showStockGrid = colours.length > 0 || sizes.length > 0;
  const categoryNames = useMemo(
    () => unique(products.map((p) => p.category?.trim() || undefined)),
    [products],
  );
  const groupedProducts = useMemo(() => {
    const map = new Map<string, CatalogProduct[]>();
    for (const product of products) {
      const key = merchCategoryLabel(product.category);
      const list = map.get(key) ?? [];
      list.push(product);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === "Uncategorised") return 1;
      if (b === "Uncategorised") return -1;
      return a.localeCompare(b);
    });
  }, [products]);

  function openCreate() {
    setForm(emptyForm());
    setError(null);
    setOpen(true);
  }

  function openEdit(product: CatalogProduct) {
    const colourList = unique(product.variants.map((v) => v.colour));
    const sizeList = unique(product.variants.map((v) => v.size));
    const colourImages: Record<string, string> = {};
    const stockByKey: Record<string, string> = {};
    for (const v of product.variants) {
      if (v.colour && v.imageUrl && !colourImages[v.colour]) {
        colourImages[v.colour] = v.imageUrl;
      }
      stockByKey[stockKey(v.colour, v.size)] = String(v.stockQty);
    }
    const defaultImage = colourList.length
      ? ""
      : (product.variants[0]?.imageUrl ?? product.images[0] ?? "");

    setForm({
      id: product.id,
      title: product.title,
      description: product.description,
      price: (product.price_in_pence / 100).toFixed(2),
      compareAt: product.compare_at_price_in_pence
        ? (product.compare_at_price_in_pence / 100).toFixed(2)
        : "",
      sku: product.sku ?? "",
      stock: String(product.stock_quantity),
      category: product.category ?? "",
      tags: product.tags.join(", "),
      isActive: product.is_active,
      enableVariants: colourList.length > 0 || sizeList.length > 0,
      variantSize: sizeList.length ? sizeList.join(", ") : "S,M,L",
      variantColor: colourList.join(", "),
      defaultImage,
      colourImages,
      stockByKey,
    });
    setError(null);
    setOpen(true);
  }

  function cellStock(colour?: string, size?: string) {
    const key = stockKey(colour, size);
    if (Object.hasOwn(form.stockByKey, key)) return form.stockByKey[key];
    return form.stock;
  }

  function setCellStock(colour: string | undefined, size: string | undefined, value: string) {
    setForm({
      ...form,
      stockByKey: { ...form.stockByKey, [stockKey(colour, size)]: value },
    });
  }

  function save() {
    startTransition(async () => {
      setError(null);
      const pricePence = Math.round(Number(form.price) * 100);
      const stock = Number(form.stock);
      if (!form.title || Number.isNaN(pricePence) || Number.isNaN(stock)) {
        setError("Title, price, and stock are required.");
        return;
      }

      const stockByKey: Record<string, number> = {};
      if (colours.length && sizes.length) {
        for (const colour of colours) {
          for (const size of sizes) {
            stockByKey[stockKey(colour, size)] = Number(cellStock(colour, size));
          }
        }
      } else if (colours.length) {
        for (const colour of colours) {
          stockByKey[stockKey(colour)] = Number(cellStock(colour));
        }
      } else if (sizes.length) {
        for (const size of sizes) {
          stockByKey[stockKey(undefined, size)] = Number(cellStock(undefined, size));
        }
      }

      const colourImages: Record<string, string> = {};
      for (const colour of colours) {
        const url = form.colourImages[colour];
        if (url) colourImages[colour] = url;
      }

      const result = await saveDashboardProduct({
        id: form.id,
        title: form.title,
        description: form.description,
        priceMinor: pricePence,
        sku: form.sku || null,
        stockQty: stock,
        isActive: form.isActive,
        category: form.category,
        colours,
        sizes,
        colourImages,
        defaultImage: form.defaultImage || null,
        stockByKey,
      });
      if (result.error || !result.product) {
        setError(result.error ?? "Could not save product.");
        return;
      }
      setProducts((prev) =>
        form.id
          ? prev.map((p) => (p.id === form.id ? result.product! : p))
          : [result.product!, ...prev],
      );
      setOpen(false);
    });
  }

  function removeProduct() {
    if (!form.id) return;
    const ok = window.confirm(
      `Delete “${form.title || "this product"}”? This cannot be undone.`,
    );
    if (!ok) return;

    startTransition(async () => {
      setError(null);
      const result = await deleteDashboardProduct(form.id!);
      if (result.error) {
        setError(result.error);
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== form.id));
      setOpen(false);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Merch</h1>
          <p className="text-sm text-zinc-500">
            Simple stock products (colour, size, one price). Print jobs with
            dropdowns are in the catalog below.
          </p>
          {!paymentsActive && (
            <p className="mt-2 max-w-xl text-sm text-amber-800">
              Test merch here and on{" "}
              <a
                className="font-semibold text-amber-950 underline decoration-amber-950 underline-offset-2"
                href={`/s/${storeSlug}`}
                target="_blank"
                rel="noreferrer"
              >
                your preview shop
              </a>
              . The public cart stays hidden until you connect Stripe in
              Settings → Payments and Activate.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={openCreate}
            className="bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
          >
            <Plus className="size-4" />
            Add merch
          </Button>
        </div>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Type a category when you add or edit merch. Products with the same
            name group together here and on your shop.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {products.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No merch yet. Add a product and give it a category.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Embed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedProducts.map(([category, rows]) => (
                  <Fragment key={category}>
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={7}
                        className="bg-zinc-50 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                      >
                        {category}
                      </TableCell>
                    </TableRow>
                    {rows.map((product) => {
                      const thumb = productThumb(product);
                      return (
                        <TableRow
                          key={product.id}
                          className="cursor-pointer"
                          onClick={() => openEdit(product)}
                        >
                          <TableCell>
                            <div className="flex size-10 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                              {thumb ? (
                                <Image
                                  src={thumb}
                                  alt=""
                                  width={40}
                                  height={40}
                                  unoptimized={thumb.startsWith("http")}
                                  className="size-10 object-cover"
                                />
                              ) : (
                                <Package className="size-4 text-zinc-400" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {product.title}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-zinc-500">
                            {product.sku ?? "—"}
                          </TableCell>
                          <TableCell>
                            {formatGbp(product.price_in_pence)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                product.stock_quantity <= 3
                                  ? "font-medium text-amber-700"
                                  : ""
                              }
                            >
                              {product.stock_quantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                product.is_active ? "default" : "secondary"
                              }
                            >
                              {product.is_active ? "Active" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <CopySnippetButton
                              snippet={productEmbedSnippet(
                                storeSlug,
                                product.slug,
                              )}
                              label="Copy"
                              className="h-8 bg-zinc-900 text-white hover:bg-zinc-800"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-x-hidden overflow-y-hidden data-[side=right]:w-full data-[side=right]:max-w-none data-[side=right]:sm:max-w-4xl">
          <SheetHeader className="shrink-0">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              Upload a photo per colour. Sizes share that colour’s photo and keep
              their own stock.
            </SheetDescription>
          </SheetHeader>

          <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4 overflow-x-hidden overflow-y-auto overscroll-contain px-4 lg:grid-cols-2">
            <div className="grid min-w-0 content-start gap-3">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input
                  list="merch-categories"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="e.g. Hair, Apparel"
                />
                <datalist id="merch-categories">
                  {categoryNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                <p className="text-xs text-zinc-500">
                  Pick an existing name or type a new one. Same names group
                  together.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Price (£)</Label>
                  <Input
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>SKU</Label>
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
              </div>
              {showStockGrid ? (
                <div className="space-y-1.5">
                  <Label>Default stock</Label>
                  <Input
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                  <p className="text-xs text-zinc-500">
                    Used for any colour/size cell you leave blank.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Stock count</Label>
                  <Input
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              )}
              {colours.length === 0 ? (
                <ImagePicker
                  label="Product photo"
                  hint="Shown on the shop for this item."
                  url={form.defaultImage}
                  onUrl={(defaultImage) => setForm({ ...form, defaultImage })}
                />
              ) : null}
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-zinc-500">Visible on storefront</p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(isActive) => setForm({ ...form, isActive })}
                />
              </div>
              <div className="space-y-3 rounded-lg border border-zinc-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Variants</p>
                    <p className="text-xs text-zinc-500">
                      Colours get their own photo. Sizes share it.
                    </p>
                  </div>
                  <Switch
                    checked={form.enableVariants}
                    onCheckedChange={(enableVariants) =>
                      setForm({ ...form, enableVariants })
                    }
                  />
                </div>
                {form.enableVariants ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Sizes</Label>
                      <Input
                        value={form.variantSize}
                        onChange={(e) =>
                          setForm({ ...form, variantSize: e.target.value })
                        }
                        placeholder="S, M, L"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Colours</Label>
                      <Input
                        value={form.variantColor}
                        onChange={(e) =>
                          setForm({ ...form, variantColor: e.target.value })
                        }
                        placeholder="Red, Green"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid min-w-0 content-start gap-3">
              {colours.length > 0 ? (
                <div className="space-y-3 rounded-lg border border-zinc-200 p-3">
                  <div>
                    <p className="text-sm font-medium">Photo per colour</p>
                    <p className="text-xs text-zinc-500">
                      Each colour below gets its own photo. Type another colour
                      in Colours to add a slot. Sizes share that colour’s photo.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {colours.map((colour) => (
                      <ImagePicker
                        key={colour}
                        label={colour}
                        url={form.colourImages[colour] ?? ""}
                        onUrl={(url) =>
                          setForm({
                            ...form,
                            colourImages: {
                              ...form.colourImages,
                              [colour]: url,
                            },
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : null}
              {showStockGrid ? (
                <div className="space-y-2 rounded-lg border border-zinc-200 p-3">
                  <p className="text-sm font-medium">Stock by selection</p>
                  <p className="text-xs text-zinc-500">
                    Set 0 to hide that colour/size on the shop.
                  </p>
                  {colours.length > 0 && sizes.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="px-1 py-1 text-left font-medium">
                            Colour
                          </th>
                          {sizes.map((size) => (
                            <th key={size} className="px-1 py-1 font-medium">
                              {size}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {colours.map((colour) => (
                          <tr key={colour}>
                            <td className="px-1 py-1">{colour}</td>
                            {sizes.map((size) => (
                              <td key={size} className="px-1 py-1">
                                <Input
                                  className="h-8 w-16"
                                  value={cellStock(colour, size)}
                                  onChange={(e) =>
                                    setCellStock(colour, size, e.target.value)
                                  }
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : colours.length > 0 ? (
                    <div className="grid gap-2">
                      {colours.map((colour) => (
                        <div key={colour} className="flex items-center gap-2">
                          <span className="w-24 text-sm">{colour}</span>
                          <Input
                            className="h-8 w-24"
                            value={cellStock(colour)}
                            onChange={(e) =>
                              setCellStock(colour, undefined, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {sizes.map((size) => (
                        <div key={size} className="flex items-center gap-2">
                          <span className="w-24 text-sm">{size}</span>
                          <Input
                            className="h-8 w-24"
                            value={cellStock(undefined, size)}
                            onChange={(e) =>
                              setCellStock(undefined, size, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
              {form.id ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Product embed</p>
                    <p className="text-xs text-zinc-500">
                      Copy this onto any page with cart.js. Colours and type
                      come from Settings → Website product &amp; cart look.
                    </p>
                  </div>
                  <CopySnippetButton
                    snippet={productEmbedSnippet(
                      storeSlug,
                      products.find((p) => p.id === form.id)?.slug ??
                        form.title
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/(^-|-$)/g, ""),
                    )}
                    label="Copy"
                  />
                </div>
              ) : null}
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          </div>

          <SheetFooter className="shrink-0 flex-row flex-wrap justify-end gap-2">
            {form.id ? (
              <Button
                variant="outline"
                className="mr-auto border-red-200 bg-white text-red-700 hover:bg-red-50"
                disabled={pending}
                onClick={removeProduct}
              >
                <Trash2 className="size-4" />
                Delete product
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="bg-white text-zinc-900"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={pending}
              className="bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
            >
              {pending ? "Saving…" : "Save product"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
