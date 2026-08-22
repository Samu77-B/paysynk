import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findStoreByPublicSlug } from "@/lib/store-lookup";
import { ConfigProductPage } from "@/components/storefront/ConfigProductPage";

type Props = { params: Promise<{ slug: string; productSlug: string }> };

export default async function StoreConfigProductRoute({ params }: Props) {
  const { slug, productSlug } = await params;
  const store = await findStoreByPublicSlug(slug);
  if (!store || store.signupStatus !== "approved") notFound();

  const product = await prisma.configProduct.findFirst({
    where: { storeId: store.id, slug: productSlug, active: true },
    include: {
      options: { include: { values: true }, orderBy: { sort: "asc" } },
      variations: { orderBy: { sort: "asc" } },
      relatedFrom: {
        orderBy: { sort: "asc" },
        include: { to: true },
      },
    },
  });
  if (!product) notFound();

  return (
    <ConfigProductPage
      store={{
        slug: store.slug,
        name: store.name,
        logoUrl: store.logoUrl,
        currency: store.currency,
        paymentsActive: store.paymentsActive,
      }}
      product={{
        ...product,
        related: product.relatedFrom
          .filter((row) => row.to.active)
          .map((row) => ({
            id: row.to.id,
            slug: row.to.slug,
            title: row.to.title,
            images: row.to.images,
          })),
      }}
    />
  );
}
