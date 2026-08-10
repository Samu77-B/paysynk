"use client";

import { useState } from "react";
import { Check, Copy, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function IntegrationHub({
  merchantId,
  merchantName,
  storeSlug,
}: {
  merchantId: string;
  merchantName: string;
  storeSlug: string;
}) {
  const snippet = `<script src="https://paysynk.com/cart.js" data-merchant-id="${merchantId}" async></script>`;
  const [copied, setCopied] = useState(false);
  const [cartOpen, setCartOpen] = useState(true);

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integration</h1>
        <p className="text-sm text-zinc-500">
          Embed PaySynk on WordPress, Next.js, Framer, Webflow, and more
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle>Embed script</CardTitle>
            <CardDescription>
              Drop this before <code>&lt;/body&gt;</code> on any site. One
              merchant ID scopes the cart to {merchantName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="overflow-x-auto rounded-xl bg-[#141414] p-4 text-sm text-[#9FE870]">
              {snippet}
            </pre>
            <Button
              onClick={copy}
              className="bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy embed script"}
            </Button>

            <Tabs defaultValue="html">
              <TabsList>
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="next">Next.js</TabsTrigger>
                <TabsTrigger value="wp">WordPress</TabsTrigger>
              </TabsList>
              <TabsContent value="html" className="text-sm text-zinc-600">
                Paste the script tag on any static page. Optional: add{" "}
                <code>data-store=&quot;{storeSlug}&quot;</code> for slug-based
                mounts.
              </TabsContent>
              <TabsContent value="next" className="text-sm text-zinc-600">
                Load via <code>next/script</code> in your root layout with{" "}
                <code>strategy=&quot;afterInteractive&quot;</code>.
              </TabsContent>
              <TabsContent value="wp" className="text-sm text-zinc-600">
                Appearance → Theme File Editor → footer.php, or use an “Insert
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
                        <p className="font-medium">Classic T-shirt</p>
                        <p className="text-zinc-500">Red / M</p>
                      </div>
                      <p>£15.00</p>
                    </div>
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-medium">Tote bag</p>
                        <p className="text-zinc-500">Bundle applied</p>
                      </div>
                      <p>£5.00</p>
                    </div>
                    <div className="border-t border-zinc-100 pt-3 text-zinc-500">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>£20.00</span>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span>UK shipping</span>
                        <span>£5.25</span>
                      </div>
                      <div className="mt-2 flex justify-between font-semibold text-zinc-900">
                        <span>Total</span>
                        <span>£25.25</span>
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
    </div>
  );
}
