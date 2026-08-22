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

export type ConfigPreview = {
  /** Photos on the currently selected choices, in option order (later ones draw on top). */
  layers: Array<{ optionName: string; label: string; url: string }>;
  fallbackUrl: string | null;
  caption: string;
};

/** Build the live shop visual from the customer's current dropdowns. */
export function configPreviewFromSelection(
  product: { images: string[]; options: PreviewOption[] },
  selections: Record<string, string>,
): ConfigPreview {
  const options = [...product.options].sort((a, b) => a.sort - b.sort);
  const layers: ConfigPreview["layers"] = [];
  const parts: string[] = [];

  for (const option of options) {
    const valueId = selections[option.id];
    if (!valueId) continue;
    const value = option.values.find((row) => row.id === valueId);
    if (!value) continue;
    parts.push(value.label);
    if (value.imageUrl) {
      layers.push({
        optionName: option.name,
        label: value.label,
        url: value.imageUrl,
      });
    }
  }

  return {
    layers,
    fallbackUrl: product.images[0] ?? null,
    caption: parts.join(" · "),
  };
}
