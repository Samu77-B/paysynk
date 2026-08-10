"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyEmbedButton({ merchantId }: { merchantId: string }) {
  const [copied, setCopied] = useState(false);
  const snippet = `<script src="https://paysynk.com/cart.js" data-merchant-id="${merchantId}" async></script>`;

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button
      onClick={copy}
      className="bg-[#141414] text-white hover:bg-zinc-800"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied embed script" : "Copy Embedded Cart Script"}
    </Button>
  );
}
