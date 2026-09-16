import {
  artworkBaseImageFromSelections,
  artworkOverlayUrl,
  artworkPackFor,
  defaultArtworkCatalogImage,
  isArtworkBaseImageUrl,
  packManagesOverlay,
} from "@/lib/config-products/artwork";
import { findMatchingVariation } from "@/lib/config-products/pricing";

export type PreviewOption = {
  id: string;
  name: string;
  sort: number;
  values: Array<{
    id: string;
    label: string;
    imageUrl?: string | null;
  }>;
};

export type PreviewVariation = {
  match: unknown;
  sort: number;
  imageUrl?: string | null;
};

export type ConfigPreview = {
  /** Photos on the currently selected choices, in option order (later ones draw on top). */
  layers: Array<{ optionName: string; label: string; url: string }>;
  fallbackUrl: string | null;
  /** One flat image for places that cannot stack layers, such as the cart line. */
  thumbnailUrl: string | null;
  caption: string;
};

/** Build the live shop visual from the customer's current dropdowns. */
export function configPreviewFromSelection(
  product: {
    slug?: string;
    title?: string;
    images: string[];
    options: PreviewOption[];
    variations?: PreviewVariation[];
  },
  selections: Record<string, string>,
): ConfigPreview {
  const options = [...product.options].sort((a, b) => a.sort - b.sort);
  const layers: ConfigPreview["layers"] = [];
  const parts: string[] = [];
  const pack =
    product.slug != null
      ? artworkPackFor({
          slug: product.slug,
          title: product.title ?? "",
        })
      : undefined;

  for (const option of options) {
    const valueId = selections[option.id];
    if (!valueId) continue;
    const value = option.values.find((row) => row.id === valueId);
    if (!value) continue;
    parts.push(value.label);
    let layerUrl: string | null | undefined = value.imageUrl;
    if (
      pack &&
      packManagesOverlay(pack, option.name, value.label)
    ) {
      layerUrl = artworkOverlayUrl(
        pack,
        options,
        selections,
        option.name,
        value.label,
      );
    }
    if (layerUrl) {
      layers.push({
        optionName: option.name,
        label: value.label,
        url: layerUrl,
      });
    }
  }

  /**
   * Only rows that carry a photo compete here, so appearance rows can sit below the
   * quantity price rows without the price rows swallowing the match.
   */
  const variation = findMatchingVariation(
    (product.variations ?? []).filter((row) =>
      isArtworkBaseImageUrl(row.imageUrl),
    ),
    selections,
  );
  const packDefault =
    product.slug != null
      ? defaultArtworkCatalogImage({
          slug: product.slug,
          title: product.title ?? "",
        })
      : null;
  const builtBase =
    pack != null
      ? artworkBaseImageFromSelections(pack, options, selections)
      : null;
  const base =
    variation?.imageUrl ||
    builtBase ||
    packDefault ||
    product.images[0] ||
    null;

  return {
    layers,
    fallbackUrl: base,
    thumbnailUrl: base || layers.at(-1)?.url || null,
    caption: parts.join(" · "),
  };
}

/** Dropdown thumb next to a choice — uses live overlay rules, not the stale saved URL. */
export function choicePreviewImageUrl(
  product: {
    slug?: string;
    title?: string;
    options: PreviewOption[];
  },
  selections: Record<string, string>,
  optionId: string,
): string | null {
  const option = product.options.find((row) => row.id === optionId);
  const valueId = selections[optionId];
  const value = option?.values.find((row) => row.id === valueId);
  if (!option || !value) return null;

  const pack =
    product.slug != null
      ? artworkPackFor({
          slug: product.slug,
          title: product.title ?? "",
        })
      : undefined;

  if (pack && packManagesOverlay(pack, option.name, value.label)) {
    return (
      artworkOverlayUrl(
        pack,
        product.options,
        selections,
        option.name,
        value.label,
      ) ??
      value.imageUrl ??
      null
    );
  }
  return value.imageUrl ?? null;
}
