/**
 * Artwork packs turn a folder of graphics under /public into variation photo rows.
 *
 * A "dimension" is a dropdown that changes the shape of the product, so it needs its own
 * base graphic; the filename is the dimension tokens joined with dashes, in pack order.
 * An "overlay" is a transparent PNG that sits on one choice and layers over any base.
 */

export type ArtworkDimension = {
  optionName: string;
  /** Normalised value label -> filename token. */
  tokens: Record<string, string>;
};

export type ArtworkOverlay = {
  optionName: string;
  valueLabel: string;
  url: string;
  /** When set, this graphic only applies if every named dropdown matches (e.g. Portrait + Double). */
  when?: Record<string, string>;
};

export type ArtworkPack = {
  /** Product slug or title this pack belongs to. */
  match: string[];
  buttonLabel: string;
  /** Public path the base graphics live under, also used to spot rows this pack created. */
  baseDir: string;
  dimensions: ArtworkDimension[];
  overlays: ArtworkOverlay[];
};

/** "85 × 55mm" and "85x55mm" both land on "85x55" so merchant edits do not break matching. */
export function normalizeLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/\s+/g, "")
    .replace(/mm$/, "");
}

export const ARTWORK_PACKS: ArtworkPack[] = [
  {
    match: ["business-cards", "business cards"],
    buttonLabel: "Business Cards graphics",
    baseDir: "/print/business-cards",
    dimensions: [
      {
        optionName: "Orientation",
        tokens: { landscape: "landscape", portrait: "portrait" },
      },
      {
        optionName: "Corners",
        tokens: { normal: "normal", roundcorners: "round", round: "round" },
      },
      {
        optionName: "Size",
        tokens: { "85x55": "85x55", "90x50": "90x50" },
      },
    ],
    overlays: [
      {
        optionName: "Printed sides",
        valueLabel: "Double",
        when: { Orientation: "Portrait" },
        url: "/print/business-cards/overlays/sides-double-portrait.png",
      },
      {
        optionName: "Printed sides",
        valueLabel: "Double",
        url: "/print/business-cards/overlays/sides-double.png",
      },
    ],
  },
];

/** Default shop/catalog graphic for the usual first-pick combo (landscape · normal · 85×55). */
export function defaultArtworkCatalogImage(product: {
  slug: string;
  title: string;
}): string | null {
  const pack = artworkPackFor(product);
  if (!pack) return null;
  return `${pack.baseDir}/landscape-normal-85x55.png`;
}

/** Catalog tile: artwork pack beats a stray General-tab upload; otherwise DB photos. */
export function configCatalogImageUrl(product: {
  slug: string;
  title: string;
  images: string[];
  variationImages?: Array<string | null | undefined>;
}): string | null {
  const pack = artworkPackFor(product);
  const fromVariation = (product.variationImages ?? []).find(
    (url) => url?.trim(),
  );
  if (pack) {
    return fromVariation ?? defaultArtworkCatalogImage(product);
  }
  return product.images[0]?.trim() || fromVariation || null;
}

export function artworkPackFor(product: {
  slug: string;
  title: string;
}): ArtworkPack | undefined {
  const keys = [product.slug, product.title].map((k) =>
    k.trim().toLowerCase(),
  );
  return ARTWORK_PACKS.find((pack) =>
    pack.match.some((m) => keys.includes(m.toLowerCase())),
  );
}

type PlanOption = {
  id: string;
  name: string;
  values: Array<{ id: string; label: string }>;
};

export type ArtworkPlan = {
  /** One row per combination of the pack's dimensions; every other dropdown stays a wildcard. */
  rows: Array<{ match: Record<string, string>; imageUrl: string }>;
  overlays: Array<{ optionId: string; valueId: string; url: string }>;
  /** Dropdowns or choices the pack expected but could not find. */
  missing: string[];
  /** Which choices each dimension recognised, so a short row count can be explained. */
  report: Array<{ optionName: string; matched: string[]; skipped: string[] }>;
};

function labelMatches(selectedLabel: string, wantedLabel: string): boolean {
  const a = normalizeLabel(selectedLabel);
  const b = normalizeLabel(wantedLabel);
  if (a === b) return true;
  return a.includes(b) || b.includes(a);
}

function findOptionByName<
  T extends { name: string; id: string; values: Array<{ id: string; label: string }> },
>(options: T[], name: string): T | undefined {
  return options.find(
    (option) => option.name.trim().toLowerCase() === name.toLowerCase(),
  );
}

/** Pick the overlay PNG for the current dropdowns (conditional rows beat the default). */
export function artworkOverlayUrl(
  pack: ArtworkPack,
  options: Array<{
    id: string;
    name: string;
    values: Array<{ id: string; label: string }>;
  }>,
  selections: Record<string, string>,
  optionName: string,
  valueLabel: string,
): string | null {
  const candidates = pack.overlays.filter(
    (row) =>
      row.optionName.toLowerCase() === optionName.toLowerCase() &&
      labelMatches(valueLabel, row.valueLabel),
  );
  if (!candidates.length) return null;

  const conditional = candidates.filter(
    (row) => row.when && Object.keys(row.when).length,
  );
  for (const row of conditional) {
    const ok = Object.entries(row.when!).every(([whenName, whenLabel]) => {
      const option = findOptionByName(options, whenName);
      if (!option) return false;
      const valueId = selections[option.id];
      if (!valueId) return false;
      const value = option.values.find((v) => v.id === valueId);
      return value ? labelMatches(value.label, whenLabel) : false;
    });
    if (ok) return row.url;
  }

  const fallback = candidates.find(
    (row) => !row.when || !Object.keys(row.when).length,
  );
  return fallback?.url ?? null;
}

export function packManagesOverlay(
  pack: ArtworkPack,
  optionName: string,
  valueLabel: string,
): boolean {
  return pack.overlays.some(
    (row) =>
      row.optionName.toLowerCase() === optionName.toLowerCase() &&
      labelMatches(valueLabel, row.valueLabel),
  );
}

/** Exact normalised match first, then a contains test so "Portrait (tall)" still finds "portrait". */
function tokenFor(
  tokens: Record<string, string>,
  label: string,
): string | undefined {
  const key = normalizeLabel(label);
  if (tokens[key]) return tokens[key];
  const loose = Object.keys(tokens)
    .sort((a, b) => b.length - a.length)
    .find((candidate) => key.includes(candidate));
  return loose ? tokens[loose] : undefined;
}

export function buildArtworkPlan(
  pack: ArtworkPack,
  options: PlanOption[],
): ArtworkPlan {
  const missing: string[] = [];
  const report: ArtworkPlan["report"] = [];
  const findOption = (name: string) =>
    options.find(
      (option) => option.name.trim().toLowerCase() === name.toLowerCase(),
    );

  const axes: Array<Array<{ optionId: string; valueId: string; token: string }>> =
    [];
  for (const dimension of pack.dimensions) {
    const option = findOption(dimension.optionName);
    if (!option) {
      missing.push(`no "${dimension.optionName}" dropdown`);
      report.push({ optionName: dimension.optionName, matched: [], skipped: [] });
      continue;
    }
    const entries: Array<{ optionId: string; valueId: string; token: string }> =
      [];
    const matched: string[] = [];
    const skipped: string[] = [];
    for (const value of option.values) {
      const token = tokenFor(dimension.tokens, value.label);
      if (token) {
        entries.push({ optionId: option.id, valueId: value.id, token });
        matched.push(value.label);
      } else {
        skipped.push(value.label);
      }
    }
    report.push({ optionName: dimension.optionName, matched, skipped });
    if (!entries.length) {
      missing.push(`no usable choices in "${dimension.optionName}"`);
      continue;
    }
    axes.push(entries);
  }

  const overlays: ArtworkPlan["overlays"] = [];
  const overlayKeysApplied = new Set<string>();
  for (const overlay of pack.overlays) {
    if (overlay.when && Object.keys(overlay.when).length) continue;
    const key = `${overlay.optionName}:${normalizeLabel(overlay.valueLabel)}`;
    if (overlayKeysApplied.has(key)) continue;
    const option = findOption(overlay.optionName);
    const value = option?.values.find((row) =>
      labelMatches(row.label, overlay.valueLabel),
    );
    if (!option || !value) {
      missing.push(`${overlay.optionName}: ${overlay.valueLabel}`);
      continue;
    }
    overlayKeysApplied.add(key);
    overlays.push({ optionId: option.id, valueId: value.id, url: overlay.url });
  }

  // A missing dimension would produce filenames that do not exist, so build nothing.
  if (missing.length) return { rows: [], overlays: [], missing, report };

  let rows: ArtworkPlan["rows"] = [{ match: {}, imageUrl: "" }];
  for (const axis of axes) {
    rows = rows.flatMap((row) =>
      axis.map((entry) => ({
        match: { ...row.match, [entry.optionId]: entry.valueId },
        imageUrl: row.imageUrl
          ? `${row.imageUrl}-${entry.token}`
          : entry.token,
      })),
    );
  }

  return {
    rows: rows.map((row) => ({
      match: row.match,
      imageUrl: `${pack.baseDir}/${row.imageUrl}.png`,
    })),
    overlays,
    missing,
    report,
  };
}
