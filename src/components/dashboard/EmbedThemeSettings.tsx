"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { saveEmbedTheme } from "@/lib/dashboard/actions";

export function EmbedThemeSettings({
  embedTheme,
}: {
  embedTheme: string;
}) {
  const [dark, setDark] = useState(embedTheme === "dark");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setDark(next);
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveEmbedTheme({ theme: next ? "dark" : "light" });
      if (result.error) {
        setDark(!next);
        setError(result.error);
        return;
      }
      setDark(result.embedTheme === "dark");
      setMessage(
        result.embedTheme === "dark"
          ? "Dark cards are on. Refresh the shop website to see them."
          : "Light cards are on. Refresh the shop website to see them.",
      );
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2">
        <div>
          <p className="text-sm font-medium">Dark product cards</p>
          <p className="text-xs text-zinc-500">
            Use dark widgets and cart on your own website. The PaySynk hosted
            shop stays as it is. Refresh the merch page after switching.
          </p>
        </div>
        <Switch
          checked={dark}
          disabled={pending}
          onCheckedChange={toggle}
          aria-label="Dark product cards"
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </div>
  );
}
