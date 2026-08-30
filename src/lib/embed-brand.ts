/** Brand kit for product widgets + cart on the merchant’s own website. */

export const DEFAULT_EMBED_ACCENT = "#9fe870";
export const DEFAULT_EMBED_ACCENT_TEXT = "#141414";

export const EMBED_FONTS = ["paysynk", "inherit", "serif"] as const;
export type EmbedFont = (typeof EMBED_FONTS)[number];

export const EMBED_RADII = ["paysynk", "inherit", "square"] as const;
export type EmbedRadius = (typeof EMBED_RADII)[number];

export function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let v = value.trim();
  if (!v) return null;
  if (v.charAt(0) !== "#") v = `#${v}`;
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  if (!/^#[0-9a-f]{6}$/i.test(v)) return null;
  return v.toLowerCase();
}

export function parseEmbedFont(value: unknown): EmbedFont {
  if (value === "inherit" || value === "serif") return value;
  return "paysynk";
}

export function parseEmbedRadius(value: unknown): EmbedRadius {
  if (value === "inherit" || value === "square") return value;
  return "paysynk";
}

export function contrastTextFor(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  if (!Number.isFinite(n)) return DEFAULT_EMBED_ACCENT_TEXT;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return y > 0.55 ? "#141414" : "#fafafa";
}

export function publicEmbedBrand(store: {
  embedAccent?: string | null;
  embedAccentText?: string | null;
  embedFont?: string | null;
  embedRadius?: string | null;
}) {
  return {
    embedAccent: normalizeHexColor(store.embedAccent),
    embedAccentText: normalizeHexColor(store.embedAccentText),
    embedFont: parseEmbedFont(store.embedFont),
    embedRadius: parseEmbedRadius(store.embedRadius),
  };
}
