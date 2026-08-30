import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Public embed/cart on the SLF website still send data-store="slf". Merch lives on saturday-love-funk. The Acme demo shop is /s/acme — do not reuse slug slf. */
const PUBLIC_SLUG_ALIASES: Record<string, string> = {
  slf: "saturday-love-funk",
};

export const findStoreByPublicSlug = cache(async function findStoreByPublicSlug(
  slug: string,
) {
  const aliased = PUBLIC_SLUG_ALIASES[slug];
  if (aliased) {
    const preferred = await prisma.store.findUnique({ where: { slug: aliased } });
    if (preferred) return preferred;
  }
  return prisma.store.findUnique({ where: { slug } });
});
