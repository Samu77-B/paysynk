"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  cartEmbedSnippet,
  CopySnippetButton,
  productEmbedSnippet,
} from "@/components/dashboard/embed-snippets";

export function IntegrationHub({
  merchantId,
  merchantName,
  storeSlug,
}: {
  merchantId: string;
  merchantName: string;
  storeSlug: string;
}) {
  const cartSnippet = cartEmbedSnippet(storeSlug, merchantId);
  const exampleProductSnippet = productEmbedSnippet(
    storeSlug,
    "acme-minimalist-heavyweight-hoodie",
  );
  const [cartOpen, setCartOpen] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integration</h1>
        <p className="text-sm text-zinc-500">
          Shop cart on every page · product widgets wherever you sell
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle>Shop cart code</CardTitle>
            <CardDescription>
              One snippet for {merchantName}. Paste before{" "}
              <code>&lt;/body&gt;</code> on any page — floating cart + checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="overflow-x-auto rounded-xl bg-[#141414] p-4 text-sm text-[#9FE870]">
              {cartSnippet}
            </pre>
            <CopySnippetButton
              snippet={cartSnippet}
              label="Copy shop cart code"
            />
            <p className="text-sm text-zinc-600">
              Dark website? Add <code>data-theme=&quot;dark&quot;</code> to this
              script and to <code>embed.js</code> so product cards and the cart
              match the page.
            </p>

            <Tabs defaultValue="html">
              <TabsList>
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="next">Next.js</TabsTrigger>
                <TabsTrigger value="wp">WordPress</TabsTrigger>
              </TabsList>
              <TabsContent value="html" className="text-sm text-zinc-600">
                Paste once site-wide. Uses <code>data-store=&quot;{storeSlug}&quot;</code>{" "}
                so the basket stays scoped to this shop.
              </TabsContent>
              <TabsContent value="next" className="text-sm text-zinc-600">
                Load via <code>next/script</code> in your root layout with{" "}
                <code>strategy=&quot;afterInteractive&quot;</code>.
              </TabsContent>
              <TabsContent value="wp" className="text-sm text-zinc-600">
                Appearance → Theme File Editor → footer.php, or an “Insert
                Headers and Footers” plugin.
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Live cart preview</CardTitle>
            <CardDescription>
              How the PaySynk slide-out drawer renders on a host site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <div className="h-3 w-24 rounded bg-zinc-100" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCartOpen(true)}
                >
                  <ShoppingBag className="size-4" />
                  Cart (2)
                </Button>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-28 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-50"
                  />
                ))}
              </div>

              {cartOpen && (
                <div className="absolute inset-y-0 right-0 flex w-[min(100%,320px)] flex-col border-l border-zinc-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                    <p className="font-semibold">Your cart</p>
                    <button
                      type="button"
                      className="text-sm text-zinc-500"
                      onClick={() => setCartOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                  <div className="flex-1 space-y-3 p-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-medium">Acme Heavyweight Hoodie</p>
                        <p className="text-zinc-500">Charcoal Black / M</p>
                      </div>
                      <p>£65.00</p>
                    </div>
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-medium">Acme Water Bottle</p>
                        <p className="text-zinc-500">Matte Black</p>
                      </div>
                      <p>£22.00</p>
                    </div>
                    <div className="border-t border-zinc-100 pt-3 text-zinc-500">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>£87.00</span>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span>UK shipping</span>
                        <span>£5.25</span>
                      </div>
                      <div className="mt-2 flex justify-between font-semibold text-zinc-900">
                        <span>Total</span>
                        <span>£92.25</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-zinc-100 p-4">
                    <Button className="w-full bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]">
                      Checkout
                    </Button>
                    <p className="mt-2 text-center text-[11px] text-zinc-400">
                      Powered by PaySynk
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Product embed codes</CardTitle>
          <CardDescription>
            Each product under Products has its own snippet. Example for the
            Acme hoodie — paste on any landing page alongside the shop cart
            code above.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="overflow-x-auto rounded-xl bg-[#141414] p-4 text-sm text-[#9FE870]">
            {exampleProductSnippet}
          </pre>
          <CopySnippetButton
            snippet={exampleProductSnippet}
            label="Copy example product code"
          />
          <p className="text-sm text-zinc-600">
            Open a product in <strong>Products</strong> to copy its exact embed
            code. Buy buttons share the same basket as this shop’s cart.js.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
