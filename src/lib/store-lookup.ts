import { prisma } from "@/lib/prisma";

/** Public embed/cart still use data-store="slf"; merch lives on the later store. */
const PUBLIC_SLUG_ALIASES: Record<string, string> = {
  slf: "saturday-love-funk",
};

export async function findStoreByPublicSlug(slug: string) {
  const aliased = PUBLIC_SLUG_ALIASES[slug];
  if (aliased) {
    const preferred = await prisma.store.findUnique({ where: { slug: aliased } });
    if (preferred) return preferred;
  }
  return prisma.store.findUnique({ where: { slug } });
}
