import { prisma } from "@/lib/prisma";
import { toPublicOffer, type PublicOffer } from "@/lib/offers";

export async function getActiveStoreOffers(
  storeId: string,
): Promise<PublicOffer[]> {
  const rows = await prisma.offer.findMany({
    where: { storeId, active: true },
    orderBy: { createdAt: "asc" },
  });
  const giftIds = rows
    .map((row) => row.giftProductId)
    .filter((id): id is string => Boolean(id));
  const giftProducts =
    giftIds.length === 0
      ? []
      : await prisma.product.findMany({
          where: { id: { in: giftIds }, storeId },
          select: { id: true, title: true },
        });
  const giftTitleById = new Map(giftProducts.map((p) => [p.id, p.title]));
  return rows.map((row) =>
    toPublicOffer(
      row,
      row.giftProductId ? giftTitleById.get(row.giftProductId) ?? null : null,
    ),
  );
}
