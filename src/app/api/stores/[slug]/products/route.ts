import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  embedCorsPreflight,
  slugifyProductKey,
  withEmbedCors,
} from "@/lib/embed-cors";
import { getActiveStoreOffers } from "@/lib/store-offers";
import { findStoreByPublicSlug } from "@/lib/store-lookup";
import { INTERNATIONAL_SHIPPING_COUNTRIES } from "@/lib/shipping-countries";
import { publicEmbedBrand } from "@/lib/embed-brand";

type Params = { params: Promise<{ slug: string }> };

export async function OPTIONS() {
  return embedCorsPreflight();
}

/** GET sellable products for a store.
 *  Out-of-stock variants are included so embeds can show “Out of stock”
 *  instead of “Product not found”.
 *  Optional ?product=id-or-slug filters to one product for embed widgets.
 */
export async function GET(req: Request, { params }: Params) {
  const { slug } = await params;
  const productKey = new URL(req.url).searchParams.get("product")?.trim() || "";

  try {
    const store = await findStoreByPublicSlug(slug);
    if (!store) {
      return withEmbedCors(
        NextResponse.json({ error: "Store not found" }, { status: 404 }),
      );
    }
    if (store.signupStatus !== "approved") {
      return withEmbedCors(
        NextResponse.json({ error: "Store is not live yet" }, { status: 403 }),
      );
    }

    const products = await prisma.product.findMany({
      where: { storeId: store.id, active: true },
      orderBy: { title: "asc" },
      include: {
        variants: {
          orderBy: { sku: "asc" },
        },
      },
    });

    const mapped = products
      .filter((p) => p.variants.length > 0)
      .map((p) => ({
        id: p.id,
        slug: slugifyProductKey(p.title),
        title: p.title,
        description: p.description,
        images: p.images,
        kind: p.kind,
        variants: p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          options: v.options as Record<string, string>,
          priceMinor: v.priceMinor,
          stockQty: v.stockQty,
          imageUrl: v.imageUrl,
        })),
      }));

    const filtered = productKey
      ? mapped.filter(
          (p) =>
            p.id === productKey ||
            p.slug === productKey ||
            p.slug.startsWith(productKey) ||
            productKey.startsWith(p.slug),
        )
      : mapped;

    if (productKey && filtered.length === 0) {
      return withEmbedCors(
        NextResponse.json({ error: "Product not found" }, { status: 404 }),
      );
    }

    const offers = await getActiveStoreOffers(store.id);

    return withEmbedCors(
      NextResponse.json({
        store: {
          id: store.id,
          slug: store.slug,
          name: store.name,
          logoUrl: store.logoUrl,
          currency: store.currency,
          shippingFlatMinor: store.shippingFlatMinor,
          shippingIntlMinor: store.shippingIntlMinor,
          shippingCountries: INTERNATIONAL_SHIPPING_COUNTRIES,
          paymentsActive: store.paymentsActive,
          embedTheme: store.embedTheme === "dark" ? "dark" : "light",
          ...publicEmbedBrand(store),
        },
        products: filtered,
        offers,
      }),
    );
  } catch (err) {
    console.error(err);
    return withEmbedCors(
      NextResponse.json({ error: "Failed to load products" }, { status: 500 }),
    );
  }
}
