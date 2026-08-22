"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, Layers, Plus, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/pricing";
import { compressProductImage } from "@/lib/compress-image";
import {
  addConfigFromTemplate,
  createBlankConfigProduct,
  deleteConfigProduct,
  duplicateConfigProduct,
  saveConfigProduct,
} from "@/lib/dashboard/config-actions";
import type {
  DashboardConfigOption,
  DashboardConfigProduct,
  DashboardConfigTemplate,
  DashboardConfigVariation,
} from "@/lib/dashboard/config-data";
import type { ModifierKind } from "@/generated/prisma/client";

function tempId() {
  return `tmp-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyOption(): DashboardConfigOption {
  return {
    id: tempId(),
    name: "New option",
    required: true,
    sort: 0,
    values: [
      {
        id: tempId(),
        label: "Option 1",
        sort: 0,
        modifierKind: "none",
        modifierValue: 0,
      },
    ],
  };
}

export function ConfigProductsManager({
  storeSlug,
  currency,
  initialProducts,
  templates,
}: {
  storeSlug: string;
  currency: string;
  initialProducts: DashboardConfigProduct[];
  templates: DashboardConfigTemplate[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<DashboardConfigProduct | null>(null);
  const [tab, setTab] = useState("general");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const groupedTemplates = useMemo(() => {
    const map = new Map<string, DashboardConfigTemplate[]>();
    for (const t of templates) {
      const key = t.category || "Other";
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [templates]);

  function open(product: DashboardConfigProduct) {
    setEditing(structuredClone(product));
    setTab("general");
    setError(null);
    setMessage(null);
  }

  function patch(partial: Partial<DashboardConfigProduct>) {
    setEditing((cur) => (cur ? { ...cur, ...partial } : cur));
  }

  function save() {
    if (!editing) return;
    startTransition(async () => {
      setError(null);
      const result = await saveConfigProduct({
        id: editing.id,
        title: editing.title,
        sku: editing.sku,
        description: editing.description,
        images: editing.images,
        category: editing.category,
        active: editing.active,
        basePriceMinor: editing.basePriceMinor,
        uploadsEnabled: editing.uploadsEnabled,
        instructionsEnabled: editing.instructionsEnabled,
        options: editing.options,
        variations: editing.variations,
        relatedIds: editing.relatedIds,
      });
      if (result.error || !result.product) {
        setError(result.error || "Could not save.");
        return;
      }
      setProducts((prev) => {
        const next = prev.filter((p) => p.id !== result.product!.id);
        return [...next, result.product!].sort((a, b) =>
          a.title.localeCompare(b.title),
        );
      });
      setEditing(result.product);
      setMessage("Saved. Customers see this on your shop and embed.");
    });
  }

  async function uploadImage(file: File) {
    if (!editing) return;
    const compressed = await compressProductImage(file);
    const body = new FormData();
    body.set("file", compressed);
    const res = await fetch("/api/uploads/product-image", {
      method: "POST",
      body,
    });
    const json = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !json.url) {
      setError(json.error || "Upload failed.");
      return;
    }
    patch({ images: [...editing.images, json.url] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Print products</h1>
        <p className="text-sm text-zinc-500">
          Ecwid-style setup: General, Options (dropdowns), Variations (combo
          prices). This is the print catalog — Business Cards, brochures, and
          the rest. Each shop has its own list and prices.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() =>
            startTransition(async () => {
              const result = await createBlankConfigProduct();
              if (result.productId) {
                setMessage("Blank product created — add options next.");
                const res = await fetch("/app/print", { method: "GET" });
                void res;
                window.location.reload();
              }
            })
          }
          className="bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
        >
          <Plus className="size-4" />
          Add new product
        </Button>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Your catalog</CardTitle>
          <CardDescription>
            {products.length} configurable product
            {products.length === 1 ? "" : "s"} · shop{" "}
            <code className="rounded bg-zinc-100 px-1">/s/{storeSlug}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No print products yet. Add a blank one or copy a template below.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer"
                    onClick={() => open(product)}
                  >
                    <TableCell>
                      <div className="font-medium">{product.title}</div>
                      <div className="text-xs text-zinc-500">
                        {product.active ? "Live" : "Draft"} · {product.sku || product.slug}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {product.category || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {product.options.length} dropdowns
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatMoney(product.basePriceMinor, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startTransition(async () => {
                            await duplicateConfigProduct(product.id);
                            window.location.reload();
                          });
                        }}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Add from template</CardTitle>
          <CardDescription>
            Copies a starter (Paperboy-style menu) into this shop. You then
            change dropdowns and prices. Other printers are not affected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedTemplates.map(([category, rows]) => (
            <div key={category}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {category}
              </p>
              <div className="flex flex-wrap gap-2">
                {rows.map((t) => (
                  <Button
                    key={t.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await addConfigFromTemplate(t.id);
                        if (result.error) {
                          setError(result.error);
                          return;
                        }
                        window.location.reload();
                      })
                    }
                  >
                    {t.title}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Sheet open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {editing ? (
            <>
              <SheetHeader>
                <SheetTitle>{editing.title || "Product"}</SheetTitle>
                <SheetDescription>
                  Same idea as Ecwid: General, Options, Variations, Related.
                </SheetDescription>
              </SheetHeader>

              <Tabs value={tab} onValueChange={setTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="options">Options</TabsTrigger>
                  <TabsTrigger value="variations">Variations</TabsTrigger>
                  <TabsTrigger value="related">Related</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      value={editing.title}
                      onChange={(e) => patch({ title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>SKU</Label>
                      <Input
                        value={editing.sku}
                        onChange={(e) => patch({ sku: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Category</Label>
                      <Input
                        value={editing.category}
                        onChange={(e) => patch({ category: e.target.value })}
                        placeholder="Business Products"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Base price ({currency.toUpperCase()})</Label>
                    <Input
                      inputMode="decimal"
                      value={(editing.basePriceMinor / 100).toFixed(2)}
                      onChange={(e) =>
                        patch({
                          basePriceMinor: Math.round(
                            (Number(e.target.value) || 0) * 100,
                          ),
                        })
                      }
                    />
                    <p className="text-xs text-zinc-500">
                      Used when no variation matches. Option +/− amounts still
                      add on top.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label>Details</Label>
                    <Textarea
                      rows={5}
                      value={editing.description}
                      onChange={(e) => patch({ description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                    <span className="text-sm">Live on shop</span>
                    <Switch
                      checked={editing.active}
                      onCheckedChange={(active) => patch({ active })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                    <span className="text-sm">Customer file upload</span>
                    <Switch
                      checked={editing.uploadsEnabled}
                      onCheckedChange={(uploadsEnabled) =>
                        patch({ uploadsEnabled })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                    <span className="text-sm">Special instructions box</span>
                    <Switch
                      checked={editing.instructionsEnabled}
                      onCheckedChange={(instructionsEnabled) =>
                        patch({ instructionsEnabled })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Images</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadImage(file);
                        e.target.value = "";
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {editing.images.map((url) => (
                        <button
                          key={url}
                          type="button"
                          className="text-xs text-red-600 underline"
                          onClick={() =>
                            patch({
                              images: editing.images.filter((u) => u !== url),
                            })
                          }
                        >
                          Remove image
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="options" className="space-y-4 pt-4">
                  <p className="text-sm text-zinc-500">
                    Dropdowns the customer sees. Amount = add money; percent =
                    e.g. Rush +15%.
                  </p>
                  {editing.options.map((option, optionIndex) => (
                    <div
                      key={option.id}
                      className="space-y-2 rounded-xl border border-zinc-200 p-3"
                    >
                      <div className="flex gap-2">
                        <Input
                          value={option.name}
                          onChange={(e) => {
                            const options = [...editing.options];
                            options[optionIndex] = {
                              ...option,
                              name: e.target.value,
                            };
                            patch({ options });
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            patch({
                              options: editing.options.filter(
                                (_, i) => i !== optionIndex,
                              ),
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-zinc-600">
                        <Switch
                          checked={option.required}
                          onCheckedChange={(required) => {
                            const options = [...editing.options];
                            options[optionIndex] = { ...option, required };
                            patch({ options });
                          }}
                        />
                        Required
                      </label>
                      {option.values.map((value, valueIndex) => (
                        <div
                          key={value.id}
                          className="grid grid-cols-[1fr_7rem_5rem_auto] items-center gap-2"
                        >
                          <Input
                            value={value.label}
                            onChange={(e) => {
                              const options = [...editing.options];
                              const values = [...option.values];
                              values[valueIndex] = {
                                ...value,
                                label: e.target.value,
                              };
                              options[optionIndex] = { ...option, values };
                              patch({ options });
                            }}
                          />
                          <select
                            className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm"
                            value={value.modifierKind}
                            onChange={(e) => {
                              const options = [...editing.options];
                              const values = [...option.values];
                              values[valueIndex] = {
                                ...value,
                                modifierKind: e.target
                                  .value as ModifierKind,
                              };
                              options[optionIndex] = { ...option, values };
                              patch({ options });
                            }}
                          >
                            <option value="none">No extra</option>
                            <option value="amount">+ amount</option>
                            <option value="percent">+ %</option>
                          </select>
                          <Input
                            disabled={value.modifierKind === "none"}
                            value={
                              value.modifierKind === "percent"
                                ? String(value.modifierValue)
                                : (value.modifierValue / 100).toFixed(2)
                            }
                            onChange={(e) => {
                              const n = Number(e.target.value) || 0;
                              const options = [...editing.options];
                              const values = [...option.values];
                              values[valueIndex] = {
                                ...value,
                                modifierValue:
                                  value.modifierKind === "percent"
                                    ? Math.round(n)
                                    : Math.round(n * 100),
                              };
                              options[optionIndex] = { ...option, values };
                              patch({ options });
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const options = [...editing.options];
                              options[optionIndex] = {
                                ...option,
                                values: option.values.filter(
                                  (_, i) => i !== valueIndex,
                                ),
                              };
                              patch({ options });
                            }}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const options = [...editing.options];
                          options[optionIndex] = {
                            ...option,
                            values: [
                              ...option.values,
                              {
                                id: tempId(),
                                label: "New value",
                                sort: option.values.length,
                                modifierKind: "none",
                                modifierValue: 0,
                              },
                            ],
                          };
                          patch({ options });
                        }}
                      >
                        Add value
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      patch({
                        options: [
                          ...editing.options,
                          { ...emptyOption(), sort: editing.options.length },
                        ],
                      })
                    }
                  >
                    <Plus className="size-4" />
                    Add dropdown
                  </Button>
                </TabsContent>

                <TabsContent value="variations" className="space-y-4 pt-4">
                  <p className="text-sm text-zinc-500">
                    First matching row wins (top to bottom). Use Any for a
                    wildcard — same as Ecwid.
                  </p>
                  {editing.variations.map((row, index) => (
                    <VariationRow
                      key={row.id}
                      row={row}
                      options={editing.options}
                      currency={currency}
                      onChange={(next) => {
                        const variations = [...editing.variations];
                        variations[index] = next;
                        patch({ variations });
                      }}
                      onRemove={() =>
                        patch({
                          variations: editing.variations.filter(
                            (_, i) => i !== index,
                          ),
                        })
                      }
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      patch({
                        variations: [
                          ...editing.variations,
                          {
                            id: tempId(),
                            match: {},
                            priceMinor: editing.basePriceMinor,
                            sku: "",
                            sort: editing.variations.length,
                          },
                        ],
                      })
                    }
                  >
                    <Layers className="size-4" />
                    Add variation
                  </Button>
                </TabsContent>

                <TabsContent value="related" className="space-y-3 pt-4">
                  <p className="text-sm text-zinc-500">
                    You may also like — shown under the product, like Paperboy.
                  </p>
                  {products
                    .filter((p) => p.id !== editing.id)
                    .map((p) => {
                      const on = editing.relatedIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                        >
                          {p.title}
                          <Switch
                            checked={on}
                            onCheckedChange={(checked) =>
                              patch({
                                relatedIds: checked
                                  ? [...editing.relatedIds, p.id]
                                  : editing.relatedIds.filter((id) => id !== p.id),
                              })
                            }
                          />
                        </label>
                      );
                    })}
                </TabsContent>
              </Tabs>

              {error ? (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              ) : null}
              {message ? (
                <p className="mt-3 text-sm text-zinc-600">{message}</p>
              ) : null}

              <SheetFooter className="mt-6 gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteConfigProduct(editing.id);
                      setProducts((prev) =>
                        prev.filter((p) => p.id !== editing.id),
                      );
                      setEditing(null);
                    })
                  }
                >
                  Delete
                </Button>
                <Button
                  type="button"
                  className="bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
                  disabled={pending}
                  onClick={save}
                >
                  {pending ? "Saving…" : "Save"}
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function VariationRow({
  row,
  options,
  currency,
  onChange,
  onRemove,
}: {
  row: DashboardConfigVariation;
  options: DashboardConfigOption[];
  currency: string;
  onChange: (row: DashboardConfigVariation) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-zinc-200 p-3">
      {options.map((option) => (
        <label key={option.id} className="block text-xs text-zinc-600">
          {option.name}
          <select
            className="mt-1 h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm"
            value={row.match[option.id] ?? "*"}
            onChange={(e) =>
              onChange({
                ...row,
                match: { ...row.match, [option.id]: e.target.value },
              })
            }
          >
            <option value="*">Any</option>
            {option.values.map((value) => (
              <option key={value.id} value={value.id}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <Input
          placeholder="Price"
          value={(row.priceMinor / 100).toFixed(2)}
          onChange={(e) =>
            onChange({
              ...row,
              priceMinor: Math.round((Number(e.target.value) || 0) * 100),
            })
          }
        />
        <Input
          placeholder="SKU"
          value={row.sku}
          onChange={(e) => onChange({ ...row, sku: e.target.value })}
        />
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
      <p className="text-[11px] text-zinc-400">
        {formatMoney(row.priceMinor, currency)} for this combo
      </p>
    </div>
  );
}
