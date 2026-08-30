/** Brand kit for product widgets, cart, and the hosted shop at /s/[slug]. */

export const DEFAULT_EMBED_ACCENT = "#9fe870";
export const DEFAULT_EMBED_ACCENT_TEXT = "#141414";

export const EMBED_FONTS = ["paysynk", "inherit", "serif"] as const;
export type EmbedFont = (typeof EMBED_FONTS)[number];

export const EMBED_RADII = ["paysynk", "inherit", "square"] as const;
export type EmbedRadius = (typeof EMBED_RADII)[number];

export type EmbedBrandStore = {
  embedTheme?: string | null;
  embedAccent?: string | null;
  embedAccentText?: string | null;
  embedFont?: string | null;
  embedRadius?: string | null;
};

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

export function publicEmbedBrand(store: EmbedBrandStore) {
  return {
    embedAccent: normalizeHexColor(store.embedAccent),
    embedAccentText: normalizeHexColor(store.embedAccentText),
    embedFont: parseEmbedFont(store.embedFont),
    embedRadius: parseEmbedRadius(store.embedRadius),
  };
}

export function parseEmbedTheme(value: unknown): "light" | "dark" {
  return value === "dark" ? "dark" : "light";
}

function brandLooksCustom(store: EmbedBrandStore | null | undefined): boolean {
  if (!store) return false;
  const font = parseEmbedFont(store.embedFont);
  const radius = parseEmbedRadius(store.embedRadius);
  const accent = normalizeHexColor(store.embedAccent);
  return (
    font !== "paysynk" ||
    radius !== "paysynk" ||
    (accent != null && accent !== DEFAULT_EMBED_ACCENT)
  );
}

/**
 * Widgets default to light (they sit on the merchant’s site). The hosted
 * shop stays PaySynk-dark until they customise type, corners, or colour —
 * then light/dark follows the Settings toggle.
 */
export function hostedShopSurface(
  store: EmbedBrandStore | null | undefined,
): "light" | "dark" {
  if (!store) return "dark";
  if (parseEmbedTheme(store.embedTheme) === "dark") return "dark";
  return brandLooksCustom(store) ? "light" : "dark";
}

/** Hosted /s/[slug] has no parent page, so “match website” becomes serif. */
export function hostedFontStack(font: EmbedFont): string {
  if (font === "serif" || font === "inherit") {
    return 'Georgia, "Times New Roman", Times, serif';
  }
  return 'var(--font-body), Outfit, system-ui, sans-serif';
}

export function hostedHeadingStack(font: EmbedFont): string {
  if (font === "serif" || font === "inherit") {
    return 'Georgia, "Times New Roman", Times, serif';
  }
  return 'var(--font-display), Syne, system-ui, sans-serif';
}

/** Hosted shop cannot sample host buttons, so “match website” is square. */
export function hostedButtonRadius(radius: EmbedRadius): string {
  if (radius === "square" || radius === "inherit") return "0px";
  return "999px";
}

export function hostedCardRadius(radius: EmbedRadius): string {
  if (radius === "square" || radius === "inherit") return "0px";
  return "10px";
}

export function hostedControlRadius(radius: EmbedRadius): string {
  if (radius === "square" || radius === "inherit") return "0px";
  return "8px";
}

export function storefrontPageClassName(
  store: EmbedBrandStore | null | undefined,
): string {
  const brand = publicEmbedBrand(store ?? {});
  const serif =
    brand.embedFont === "serif" || brand.embedFont === "inherit"
      ? " store-page-serif"
      : "";
  return `store-page store-page-${hostedShopSurface(store)}${serif}`;
}

export function storefrontCssVars(
  store: EmbedBrandStore | null | undefined,
): Record<string, string> {
  const brand = publicEmbedBrand(store ?? {});
  const customized = brandLooksCustom(store);
  const accent = brand.embedAccent ?? DEFAULT_EMBED_ACCENT;
  const accentText = brand.embedAccentText ?? contrastTextFor(accent);
  const cardRadius = customized ? hostedCardRadius(brand.embedRadius) : "10px";
  const vars: Record<string, string> = {
    "--store-font": hostedFontStack(brand.embedFont),
    "--store-heading-font": hostedHeadingStack(brand.embedFont),
    "--store-btn-radius": customized
      ? hostedButtonRadius(brand.embedRadius)
      : "8px",
    "--store-card-radius": cardRadius,
    "--store-control-radius": customized
      ? hostedControlRadius(brand.embedRadius)
      : "8px",
    "--radius": cardRadius,
  };
  if (customized) {
    vars["--accent"] = accent;
    vars["--accent-ink"] = accentText;
  }
  if (hostedShopSurface(store) === "light") {
    Object.assign(vars, {
      "--bg": "#f6f1ea",
      "--bg-elevated": "#ffffff",
      "--bg-panel": "#ffffff",
      "--bg-soft": "#efe8de",
      "--ink": "#2b2622",
      "--ink-soft": "#6f675e",
      "--line": "#e4d9cc",
    });
  }
  return vars;
}
