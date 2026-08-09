import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Storefront } from "@/components/storefront/Storefront";

type Props = { params: Promise<{ slug: string }> };

export default async function StorePage({ params }: Props) {
  const { slug } = await params;

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();

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
      kind: p.kind,
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        options: (v.options ?? {}) as Record<string, string>,
        priceMinor: v.priceMinor,
        stockQty: v.stockQty,
      })),
    }));

  return (
    <Storefront
      store={{
        slug: store.slug,
        name: store.name,
        currency: store.currency,
        shippingFlatMinor: store.shippingFlatMinor,
      }}
      products={sellable}
    />
  );
}
