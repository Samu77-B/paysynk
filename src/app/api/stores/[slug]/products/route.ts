import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

/** GET sellable products for a store (variants with stockQty > 0 only). */
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;

  try {
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
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

    const sellable = products.filter((p) => p.variants.length > 0);

    return NextResponse.json({
      store: {
        id: store.id,
        slug: store.slug,
        name: store.name,
        currency: store.currency,
        shippingFlatMinor: store.shippingFlatMinor,
      },
      products: sellable.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        images: p.images,
        kind: p.kind,
        variants: p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          options: v.options,
          priceMinor: v.priceMinor,
          stockQty: v.stockQty,
        })),
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
