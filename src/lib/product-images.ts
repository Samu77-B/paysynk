function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const HOODIE_BY_COLOUR: Record<string, string> = {
  offwhite: "/products/Acme Hoodie Off White.png",
  charcoalblack: "/products/acme-minimalist-heavyweight-hoodie.png",
  forestgreen: "/products/Acme Hoodie Forrest Green.png",
  forrestgreen: "/products/Acme Hoodie Forrest Green.png",
};

const BOTTLE_BY_COLOUR: Record<string, string> = {
  matteblack: "/products/acme-insulated-steel-water-bottle.png",
  rawsilver: "/products/Acme Water Bottle Raw Silver.png",
  sagegreen: "/products/Acme Water Bottle Sage Green.png",
};

type ImageVariant = {
  options: Record<string, string>;
  imageUrl?: string | null;
};

/** Lifestyle / default gallery photo, stored first on the product. */
export function lifestyleImage(product: {
  images: string[];
  variants?: Array<{ imageUrl?: string | null }>;
}): string | undefined {
  if (product.images[0]) return product.images[0];
  return product.variants?.find((v) => v.imageUrl)?.imageUrl ?? undefined;
}

/** Gallery photo that is not a colour variant shot — the product default. */
export function distinctLifestyleImage(product: {
  images: string[];
  variants?: Array<{
    imageUrl?: string | null;
    options?: Record<string, string>;
  }>;
}): string | undefined {
  const colourUrls = new Set<string>();
  for (const variant of product.variants ?? []) {
    if (variant.options?.colour && variant.imageUrl) {
      colourUrls.add(variant.imageUrl);
    }
  }
  return product.images.find((src) => src && !colourUrls.has(src));
}

/** Merchant-uploaded photo for this colour, then filename maps, then lifestyle. */
export function imageForSelection(
  product: { title: string; images: string[]; variants: ImageVariant[] },
  colour: string,
  selected?: { imageUrl?: string | null } | null,
): string | undefined {
  if (selected?.imageUrl) return selected.imageUrl;
  if (colour) {
    const match = product.variants.find(
      (v) => v.options.colour === colour && v.imageUrl,
    );
    if (match?.imageUrl) return match.imageUrl;
    return imageForColour(product, colour);
  }
  return lifestyleImage(product) ?? imageForColour(product, colour);
}

/** Product photo that matches the selected colour, falling back to the first gallery image. */
export function imageForColour(
  product: { title: string; images: string[] },
  colour: string,
): string | undefined {
  const title = product.title.toLowerCase();
  const key = slug(colour);
  let mapped: string | undefined;

  if (title.includes("hoodie")) mapped = HOODIE_BY_COLOUR[key];
  else if (title.includes("bottle")) mapped = BOTTLE_BY_COLOUR[key];

  if (mapped) return mapped;

  if (key) {
    const needles =
      key === "forestgreen" ? ["forestgreen", "forrestgreen"] : [key];
    const match = product.images.find((src) => {
      const file = slug(src);
      return needles.some((n) => file.includes(n));
    });
    if (match) return match;
  }

  return product.images[0];
}
