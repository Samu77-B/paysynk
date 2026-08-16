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
