import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Storefront } from "@/components/storefront/Storefront";
import { getActiveStoreOffers } from "@/lib/store-offers";
import { findStoreByPublicSlug } from "@/lib/store-lookup";

type Props = { params: Promise<{ slug: string }> };

export default async function StorePage({ params }: Props) {
  const { slug } = await params;

  const store = await findStoreByPublicSlug(slug);
  if (!store) notFound();

  if (store.signupStatus !== "approved") {
    return (
      <main className="success-page">
        <p className="eyebrow accent-text">PaySynk</p>
        <h1>{store.name}</h1>
        <p className="muted">
          {store.signupStatus === "rejected"
            ? "This shop is not available."
            : "This shop is awaiting approval. You can still set up products in your merchant dashboard."}
        </p>
      </main>
    );
  }

  const products = await prisma.product.findMany({
    where: { storeId: store.id, active: true },
    orderBy: { title: "asc" },
    include: {
      variants: {
        where: { stockQty: { gt: 0 } },
        orderBy: { sku: "asc" },
      },
    },
  });

  const sellable = products
    .filter((p) => p.variants.length > 0)
    .map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      images: p.images,
      category: p.category.trim() || "Merch",
      kind: p.kind,
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        options: (v.options ?? {}) as Record<string, string>,
        priceMinor: v.priceMinor,
        stockQty: v.stockQty,
        imageUrl: v.imageUrl,
      })),
    }));

  const configRows = await prisma.configProduct.findMany({
    where: { storeId: store.id, active: true },
    orderBy: [{ category: "asc" }, { title: "asc" }],
    include: { variations: true },
  });
  const configProducts = configRows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    images: p.images,
    category: p.category || "Print",
    fromPriceMinor: (() => {
      const prices = [
        p.basePriceMinor,
        ...p.variations.map((v) => v.priceMinor),
      ].filter((n) => n > 0);
      return prices.length ? Math.min(...prices) : p.basePriceMinor || null;
    })(),
  }));

  const offers = await getActiveStoreOffers(store.id);

  return (
    <Storefront
      store={{
        slug: store.slug,
        name: store.name,
        logoUrl: store.logoUrl,
        currency: store.currency,
        homeCountry: store.homeCountry,
        shippingFlatMinor: store.shippingFlatMinor,
        shippingIntlMinor: store.shippingIntlMinor,
        paymentsActive: store.paymentsActive,
      }}
      products={sellable}
      configProducts={configProducts}
      offers={offers}
    />
  );
}
