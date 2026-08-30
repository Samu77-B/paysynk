"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveEmbedBrand, saveEmbedTheme } from "@/lib/dashboard/actions";
import {
  contrastTextFor,
  DEFAULT_EMBED_ACCENT,
  DEFAULT_EMBED_ACCENT_TEXT,
  parseEmbedFont,
  parseEmbedRadius,
  type EmbedFont,
  type EmbedRadius,
} from "@/lib/embed-brand";

const FONTS: { id: EmbedFont; label: string; hint: string }[] = [
  {
    id: "inherit",
    label: "Match my website",
    hint: "Uses the typeface already on the page you paste into.",
  },
  {
    id: "serif",
    label: "Classic serif",
    hint: "Georgia-style — salons, studios, print shops.",
  },
  {
    id: "paysynk",
    label: "PaySynk",
    hint: "Outfit / system sans, same as the dashboard.",
  },
];

const RADII: { id: EmbedRadius; label: string; hint: string }[] = [
  {
    id: "inherit",
    label: "Match my website",
    hint: "Copies square or rounded corners from buttons on the page you paste into.",
  },
  {
    id: "square",
    label: "Square",
    hint: "Sharp corners — same as CONTACT US on a salon site.",
  },
  {
    id: "paysynk",
    label: "Pill",
    hint: "Fully rounded PaySynk buttons.",
  },
];

function previewFontFamily(font: EmbedFont) {
  if (font === "inherit") return "inherit";
  if (font === "serif") return 'Georgia, "Times New Roman", Times, serif';
  return "Outfit, system-ui, sans-serif";
}

export function EmbedThemeSettings({
  embedTheme,
  embedAccent,
  embedAccentText,
  embedFont,
  embedRadius,
}: {
  embedTheme: string;
  embedAccent?: string | null;
  embedAccentText?: string | null;
  embedFont?: string;
  embedRadius?: string;
}) {
  const [dark, setDark] = useState(embedTheme === "dark");
  const [accent, setAccent] = useState(
    (embedAccent || DEFAULT_EMBED_ACCENT).toLowerCase(),
  );
  const [accentText, setAccentText] = useState(
    (embedAccentText || DEFAULT_EMBED_ACCENT_TEXT).toLowerCase(),
  );
  const [font, setFont] = useState<EmbedFont>(parseEmbedFont(embedFont));
  const [radius, setRadius] = useState<EmbedRadius>(parseEmbedRadius(embedRadius));
  const [textTouched, setTextTouched] = useState(Boolean(embedAccentText));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleDark(next: boolean) {
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
          ? "Dark cards are on. Refresh your website and your PaySynk shop to see them."
          : "Light cards are on. Refresh your website and your PaySynk shop to see them.",
      );
    });
  }

  function onAccentChange(hex: string) {
    const next = hex.toLowerCase();
    setAccent(next);
    if (!textTouched && /^#[0-9a-f]{6}$/i.test(next)) {
      setAccentText(contrastTextFor(next));
    }
  }

  function saveBrand() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveEmbedBrand({
        accent,
        accentText,
        font,
        radius,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.embedAccent) setAccent(result.embedAccent);
      if (result.embedAccentText) setAccentText(result.embedAccentText);
      if (result.embedFont) setFont(parseEmbedFont(result.embedFont));
      if (result.embedRadius) setRadius(parseEmbedRadius(result.embedRadius));
      setMessage(
        "Saved. Refresh your website and your PaySynk shop — you do not need to recopy the snippet.",
      );
    });
  }

  function resetBrand() {
    setAccent(DEFAULT_EMBED_ACCENT);
    setAccentText(DEFAULT_EMBED_ACCENT_TEXT);
    setFont("paysynk");
    setRadius("paysynk");
    setTextTouched(false);
  }

  const previewBg = dark ? "#171717" : "#fff";
  const previewText = dark ? "#f4f4f4" : "#18181b";
  const previewMuted = dark ? "#a1a1aa" : "#71717a";
  const previewLine = dark ? "#3f3f46" : "#e4e4e7";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Website product &amp; cart look</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          These colours, fonts, and button corners apply to the product snippet
          and cart on your own site, and to your PaySynk shop at{" "}
          <code className="rounded bg-zinc-100 px-1">/s/…</code>.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2">
        <div>
          <p className="text-sm font-medium">Dark product cards</p>
          <p className="text-xs text-zinc-500">
            Use dark widgets, cart, and PaySynk shop on a dark website.
          </p>
        </div>
        <Switch
          checked={dark}
          disabled={pending}
          onCheckedChange={toggleDark}
          aria-label="Dark product cards"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="embed-accent">Button colour</Label>
          <div className="flex items-center gap-2">
            <input
              id="embed-accent"
              type="color"
              value={accent}
              onChange={(e) => onAccentChange(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-md border border-zinc-200 bg-white p-0.5"
            />
            <Input
              value={accent}
              onChange={(e) => onAccentChange(e.target.value)}
              maxLength={7}
              className="font-mono uppercase"
              aria-label="Button colour hex"
            />
          </div>
          <p className="text-xs text-zinc-500">
            Add to cart, Cart, and Checkout. Pick the tan/gold from your site
            if that is your brand.
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="embed-accent-text">Button text</Label>
          <div className="flex items-center gap-2">
            <input
              id="embed-accent-text"
              type="color"
              value={accentText}
              onChange={(e) => {
                setTextTouched(true);
                setAccentText(e.target.value.toLowerCase());
              }}
              className="h-9 w-12 cursor-pointer rounded-md border border-zinc-200 bg-white p-0.5"
            />
            <Input
              value={accentText}
              onChange={(e) => {
                setTextTouched(true);
                setAccentText(e.target.value);
              }}
              maxLength={7}
              className="font-mono uppercase"
              aria-label="Button text colour hex"
            />
          </div>
          <p className="text-xs text-zinc-500">
            Keep this dark on a light button so “Add to cart” stays readable.
          </p>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Type</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {FONTS.map((row) => {
            const selected = font === row.id;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setFont(row.id)}
                className={
                  "rounded-lg border px-3 py-2 text-left " +
                  (selected
                    ? "border-[#1f6b4a] bg-[#f7fdf4]"
                    : "border-zinc-200 bg-white")
                }
              >
                <span className="block text-sm font-medium">{row.label}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  {row.hint}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Button corners</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {RADII.map((row) => {
            const selected = radius === row.id;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setRadius(row.id)}
                className={
                  "rounded-lg border px-3 py-2 text-left " +
                  (selected
                    ? "border-[#1f6b4a] bg-[#f7fdf4]"
                    : "border-zinc-200 bg-white")
                }
              >
                <span className="block text-sm font-medium">{row.label}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  {row.hint}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div
        className="rounded-xl border p-4"
        style={{
          background: previewBg,
          color: previewText,
          borderColor: previewLine,
          fontFamily: previewFontFamily(font),
        }}
      >
        <p
          className="text-[0.7rem] tracking-[0.12em] uppercase"
          style={{ color: previewMuted }}
        >
          Preview on your website
        </p>
        <p className="mt-1 text-base font-semibold">Ultimate Reset</p>
        <p className="mt-0.5 text-sm" style={{ color: previewMuted }}>
          Add to cart uses your button colour, type, and corners.
        </p>
        <button
          type="button"
          tabIndex={-1}
          className={
            "mt-3 w-full px-4 py-2.5 text-sm font-semibold " +
            (radius === "paysynk" ? "rounded-full" : "rounded-none")
          }
          style={{ background: accent, color: accentText }}
        >
          Add to cart
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={saveBrand}
          disabled={pending}
          className="bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
        >
          {pending ? "Saving…" : "Save website look"}
        </Button>
        <Button type="button" variant="ghost" onClick={resetBrand} disabled={pending}>
          Reset to PaySynk green
        </Button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </div>
  );
}
