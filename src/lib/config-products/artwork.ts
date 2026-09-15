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
        url: "/print/business-cards/overlays/sides-double.png",
      },
    ],
  },
];

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
};

export function buildArtworkPlan(
  pack: ArtworkPack,
  options: PlanOption[],
): ArtworkPlan {
  const missing: string[] = [];
  const findOption = (name: string) =>
    options.find(
      (option) => option.name.trim().toLowerCase() === name.toLowerCase(),
    );

  const axes: Array<Array<{ optionId: string; valueId: string; token: string }>> =
    [];
  for (const dimension of pack.dimensions) {
    const option = findOption(dimension.optionName);
    const entries = (option?.values ?? []).flatMap((value) => {
      const token = dimension.tokens[normalizeLabel(value.label)];
      return token
        ? [{ optionId: option!.id, valueId: value.id, token }]
        : [];
    });
    if (!entries.length) {
      missing.push(dimension.optionName);
      continue;
    }
    axes.push(entries);
  }

  const overlays: ArtworkPlan["overlays"] = [];
  for (const overlay of pack.overlays) {
    const option = findOption(overlay.optionName);
    const value = option?.values.find(
      (row) =>
        normalizeLabel(row.label) === normalizeLabel(overlay.valueLabel),
    );
    if (!option || !value) {
      missing.push(`${overlay.optionName}: ${overlay.valueLabel}`);
      continue;
    }
    overlays.push({ optionId: option.id, valueId: value.id, url: overlay.url });
  }

  // A missing dimension would produce filenames that do not exist, so build nothing.
  if (missing.length) return { rows: [], overlays: [], missing };

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
  };
}
