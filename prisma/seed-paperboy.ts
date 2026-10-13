/**
 * Idempotent ingest of the Paperboy JA print catalog (categories, products,
 * option groups, and price modifiers) onto the Paperboy tenant.
 *
 * Safe to re-run: matches products by (storeId, slug), then replaces option
 * groups and variation prices from the platform templates. Photos and
 * related-product links on existing rows are kept.
 *
 * Run:
 *   npm run db:seed:paperboy
 *   npx tsx prisma/seed-paperboy.ts
 *   npx tsx prisma/seed-paperboy.ts paperboy-ja
 *   npx tsx prisma/seed-paperboy.ts "Paperboy JA"
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { PRINT_TEMPLATES } from "@/lib/config-products/templates";
import { upsertAllTemplatesToStore } from "@/lib/config-products/copy-template";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const PAPERBOY_SLUGS = ["paperboy-ja", "paperboy", "paperboyja"];

async function findPaperboyStore(query: string | null) {
  if (query) {
    const slugGuess = slugify(query);
    return prisma.store.findFirst({
      where: {
        OR: [
          { slug: query },
          { slug: slugGuess },
          { name: { equals: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { configProducts: true } },
      },
    });
  }

  const bySlug = await prisma.store.findFirst({
    where: { slug: { in: PAPERBOY_SLUGS } },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { configProducts: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  if (bySlug) return bySlug;

  return prisma.store.findFirst({
    where: { name: { contains: "Paperboy", mode: "insensitive" } },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { configProducts: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

async function main() {
  const query = process.argv.slice(2).join(" ").trim() || null;
  const store = await findPaperboyStore(query);

  if (!store) {
    const recent = await prisma.store.findMany({
      select: { name: true, slug: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const hint = query ? `"${query}"` : "Paperboy / paperboy-ja";
    console.error(`No shop matched ${hint}. Recent shops:`);
    for (const row of recent) {
      console.error(`  ${row.slug}  (${row.name})`);
    }
    process.exit(1);
  }

  const categories = [...new Set(PRINT_TEMPLATES.map((t) => t.category))];
  console.log(
    `Seeding Paperboy catalog into ${store.name} (/${store.slug}) — currently ${store._count.configProducts} print products`,
  );
  console.log(
    `${PRINT_TEMPLATES.length} products across ${categories.length} categories: ${categories.join(", ")}`,
  );

  const result = await upsertAllTemplatesToStore(store.id);

  const products = await prisma.configProduct.findMany({
    where: { storeId: store.id },
    select: { category: true },
  });
  const grouped = new Map<string, number>();
  for (const row of products) {
    const key = row.category || "(uncategorised)";
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  console.log(
    `Done. Added ${result.added}, updated ${result.updated}. Shop now has ${products.length} print products.`,
  );
  for (const [category, count] of [...grouped.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    console.log(`  ${category}: ${count}`);
  }
  if (result.addedSlugs.length) {
    console.log("Added:", result.addedSlugs.join(", "));
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
