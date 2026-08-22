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

export function cartEmbedSnippet(
  storeSlug: string,
  merchantId: string,
  theme?: "light" | "dark",
) {
  const themeAttr = theme === "dark" ? ' data-theme="dark"' : "";
  return `<script src="https://www.paysynk.com/cart.js" data-store="${storeSlug}" data-merchant-id="${merchantId}"${themeAttr} async></script>`;
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
