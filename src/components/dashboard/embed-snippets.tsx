"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function productEmbedSnippet(
  storeSlug: string,
  productSlug: string,
  theme?: "light" | "dark",
) {
  const themeAttr = theme === "dark" ? ' data-theme="dark"' : "";
  return `<div data-paysynk-product="${productSlug}" data-store="${storeSlug}"></div>
<script src="https://www.paysynk.com/embed.js"${themeAttr} defer></script>`;
}

export function configProductEmbedSnippet(storeSlug: string, productSlug: string) {
  return `<a href="https://www.paysynk.com/s/${storeSlug}/p/${productSlug}">Customise on PaySynk</a>`;
}

export function printCatalogEmbedSnippet(storeSlug: string) {
  return `<iframe src="https://www.paysynk.com/s/${storeSlug}" style="width:100%;min-height:780px;border:0" title="Shop catalog"></iframe>`;
}

export function cartEmbedSnippet(
  storeSlug: string,
  merchantId: string,
  theme?: "light" | "dark",
) {
  const themeAttr = theme === "dark" ? ' data-theme="dark"' : "";
  return `<script src="https://www.paysynk.com/cart.js" data-store="${storeSlug}" data-merchant-id="${merchantId}"${themeAttr} async></script>`;
}

export function shopPageEmbedSnippet(
  storeSlug: string,
  productSlugs: string[],
) {
  const mounts = productSlugs
    .map(
      (slug) =>
        `  <div data-paysynk-product="${slug}" data-store="${storeSlug}"></div>`,
    )
    .join("\n");
  return `<div class="shop-grid">
${mounts || `  <div data-paysynk-product="your-product-slug" data-store="${storeSlug}"></div>`}
</div>
<script src="https://www.paysynk.com/embed.js" defer></script>`;
}

export function loyaltyJoinSnippet(storeSlug: string) {
  return `<form id="paysynk-points-join">
  <input name="name" placeholder="Name" required>
  <input name="email" type="email" placeholder="Email" required>
  <button type="submit">Join points club</button>
</form>
<script>
document.getElementById("paysynk-points-join").addEventListener("submit", async function (e) {
  e.preventDefault();
  var fd = new FormData(e.target);
  var res = await fetch("https://www.paysynk.com/api/stores/${storeSlug}/loyalty/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: fd.get("name"), email: fd.get("email") })
  });
  var data = await res.json();
  alert(res.ok ? "You're in. Balance: " + data.balance : (data.error || "Could not join"));
});
</script>`;
}

export function salonSynkEarnSnippet(storeSlug: string) {
  return `POST https://www.paysynk.com/api/stores/${storeSlug}/loyalty/earn
Authorization: Bearer psk_YOUR_KEY
Content-Type: application/json

{
  "email": "client@example.com",
  "name": "Jane Client",
  "kind": "service",
  "amountMinor": 8500,
  "sourceId": "salonsynk-booking-12345"
}`;
}

export function CopySnippetButton({
  snippet,
  label = "Copy embed code",
  className,
}: {
  snippet: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void copy();
      }}
      className={
        className ?? "bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
      }
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
