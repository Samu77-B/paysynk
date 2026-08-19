"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { compressProductImage } from "@/lib/compress-image";
import { saveStoreLogo } from "@/lib/dashboard/actions";

export function StoreLogoSettings({
  logoUrl,
}: {
  logoUrl: string | null;
}) {
  const [url, setUrl] = useState(logoUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function persist(next: string | null) {
    setError(null);
    setMessage(null);
    const result = await saveStoreLogo({ logoUrl: next });
    if (result.error) {
      setError(result.error);
      return;
    }
    setUrl(result.logoUrl ?? "");
    setMessage(
      next
        ? "Logo saved. It will show on your shop and order page."
        : "Logo removed.",
    );
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const compressed = await compressProductImage(file);
      const body = new FormData();
      body.set("file", compressed);
      const res = await fetch("/api/uploads/store-logo", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      await persist(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const waiting = busy;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Shop logo</Label>
        <p className="text-xs text-zinc-500">
          PNG with a transparent background works best on the dark storefront.
          Shown at the top of your shop and on the order confirmation page.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950">
          {url ? (
            <Image
              src={url}
              alt="Shop logo"
              width={80}
              height={80}
              unoptimized={url.startsWith("http")}
              className="max-h-20 w-auto object-contain"
            />
          ) : (
            <ImageIcon className="size-6 text-zinc-500" />
          )}
        </div>
        <div className="min-w-0 space-y-1">
          <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50">
            {waiting ? "Uploading…" : url ? "Change logo" : "Choose logo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={waiting}
              className="sr-only"
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {url ? (
            <Button
              type="button"
              variant="ghost"
              className="h-auto px-0 text-xs text-zinc-500"
              disabled={waiting}
              onClick={() => {
                setBusy(true);
                void persist(null).finally(() => setBusy(false));
              }}
            >
              Remove logo
            </Button>
          ) : null}
        </div>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </div>
  );
}
