"use client";

import {
  cartEmbedSnippet,
  CopySnippetButton,
} from "@/components/dashboard/embed-snippets";

export function CopyEmbedButton({
  merchantId,
  storeSlug,
}: {
  merchantId: string;
  storeSlug: string;
}) {
  return (
    <CopySnippetButton
      snippet={cartEmbedSnippet(storeSlug, merchantId)}
      label="Copy shop cart code"
      className="bg-[#141414] text-white hover:bg-zinc-800"
    />
  );
}
