"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Plus, Package } from "lucide-react";
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
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Product } from "@/types/database";

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
});

export function ProductsManager({
  merchantId,
  storeSlug,
  initialProducts,
  mode,
}: {
  merchantId: string;
  storeSlug: string;
  initialProducts: Product[];
  mode: "demo" | "supabase";
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

  function openCreate() {
    setForm(emptyForm());
    setError(null);
    setOpen(true);
  }

  function openEdit(product: Product) {
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
      enableVariants: false,
      variantSize: "S,M,L",
      variantColor: "",
    });
    setError(null);
    setOpen(true);
  }

  function save() {
    startTransition(async () => {
      setError(null);
      const pricePence = Math.round(Number(form.price) * 100);
      const comparePence = form.compareAt
        ? Math.round(Number(form.compareAt) * 100)
        : null;
      const stock = Number(form.stock);
      if (!form.title || Number.isNaN(pricePence) || Number.isNaN(stock)) {
        setError("Title, price, and stock are required.");
        return;
      }

      const slug = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const payload = {
        merchant_id: merchantId,
        title: form.title,
        slug: form.id ? undefined : `${slug}-${Date.now().toString(36).slice(-4)}`,
        description: form.description,
        price_in_pence: pricePence,
        compare_at_price_in_pence: comparePence,
        sku: form.sku || null,
        stock_quantity: stock,
        category: form.category || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        is_active: form.isActive,
        images: [] as string[],
      };

      if (mode === "demo" || !isSupabaseConfigured()) {
        const optimistic: Product = {
          id: form.id ?? `local_${Date.now()}`,
          merchant_id: merchantId,
          title: payload.title,
          slug: payload.slug ?? slug,
          description: payload.description,
          price_in_pence: payload.price_in_pence,
          compare_at_price_in_pence: payload.compare_at_price_in_pence,
          sku: payload.sku,
          stock_quantity: payload.stock_quantity,
          images: [],
          tags: payload.tags,
          category: payload.category,
          is_active: payload.is_active,
          created_at: new Date().toISOString(),
        };
        setProducts((prev) =>
          form.id
            ? prev.map((p) => (p.id === form.id ? { ...p, ...optimistic } : p))
            : [optimistic, ...prev],
        );
        setOpen(false);
        return;
      }

      const supabase = createClient();
      if (form.id) {
        const { data, error: updateError } = await supabase
          .from("products")
          .update({
            title: payload.title,
            description: payload.description,
            price_in_pence: payload.price_in_pence,
            compare_at_price_in_pence: payload.compare_at_price_in_pence,
            sku: payload.sku,
            stock_quantity: payload.stock_quantity,
            category: payload.category,
            tags: payload.tags,
            is_active: payload.is_active,
          })
          .eq("id", form.id)
          .eq("merchant_id", merchantId)
          .select("*")
          .single();
        if (updateError) {
          setError(updateError.message);
          return;
        }
        setProducts((prev) =>
          prev.map((p) => (p.id === form.id ? (data as Product) : p)),
        );
      } else {
        const { data, error: insertError } = await supabase
          .from("products")
          .insert({
            ...payload,
            slug: payload.slug!,
          })
          .select("*")
          .single();
        if (insertError) {
          setError(insertError.message);
          return;
        }
        setProducts((prev) => [data as Product, ...prev]);
      }
      setOpen(false);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-zinc-500">
            Catalogue, stock, and a copyable embed code per product
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
        >
          <Plus className="size-4" />
          Add product
        </Button>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
          <CardDescription>
            {products.length} products · scoped to your merchant
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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
              {products.map((product) => (
                <TableRow
                  key={product.id}
                  className="cursor-pointer"
                  onClick={() => openEdit(product)}
                >
                  <TableCell>
                    <div className="flex size-10 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 object-cover"
                        />
                      ) : (
                        <Package className="size-4 text-zinc-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500">
                    {product.sku ?? "—"}
                  </TableCell>
                  <TableCell>{formatGbp(product.price_in_pence)}</TableCell>
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
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <CopySnippetButton
                      snippet={productEmbedSnippet(storeSlug, product.slug)}
                      label="Copy"
                      className="h-8 bg-zinc-900 text-white hover:bg-zinc-800"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              Prices in GBP. Image upload hooks into Supabase Storage next.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 px-4 pb-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Price (£)</Label>
                <Input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Compare-at (£)</Label>
                <Input
                  value={form.compareAt}
                  onChange={(e) =>
                    setForm({ ...form, compareAt: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Stock count</Label>
                <Input
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
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
                  <p className="text-xs text-zinc-500">Size / colour options</p>
                </div>
                <Switch
                  checked={form.enableVariants}
                  onCheckedChange={(enableVariants) =>
                    setForm({ ...form, enableVariants })
                  }
                />
              </div>
              {form.enableVariants && (
                <div className="grid gap-3">
                  <div className="space-y-2">
                    <Label>Sizes</Label>
                    <Input
                      value={form.variantSize}
                      onChange={(e) =>
                        setForm({ ...form, variantSize: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Colours</Label>
                    <Input
                      value={form.variantColor}
                      onChange={(e) =>
                        setForm({ ...form, variantColor: e.target.value })
                      }
                      placeholder="Red, Green, Blue"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center text-sm text-zinc-500">
              Product images upload — connect Supabase Storage bucket `product-images`
            </div>
            {form.id && (
              <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <div>
                  <p className="text-sm font-medium">Product embed code</p>
                  <p className="text-xs text-zinc-500">
                    Paste on any page with this shop’s cart.js for a shared basket
                  </p>
                </div>
                <pre className="overflow-x-auto rounded-lg bg-[#141414] p-3 text-[11px] leading-relaxed text-[#9FE870]">
                  {productEmbedSnippet(
                    storeSlug,
                    products.find((p) => p.id === form.id)?.slug ??
                      form.title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, ""),
                  )}
                </pre>
                <CopySnippetButton
                  snippet={productEmbedSnippet(
                    storeSlug,
                    products.find((p) => p.id === form.id)?.slug ??
                      form.title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, ""),
                  )}
                  label="Copy product embed"
                />
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
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
