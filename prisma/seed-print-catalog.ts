/**
 * Copy missing Paperboy-style print templates into any shop.
 * Skips products whose slug is already on that shop (does not overwrite options).
 *
 * For the Paperboy JA tenant (idempotent upsert of the full catalog), use:
 *   npm run db:seed:paperboy
 *
 * Run:
 *   npx tsx prisma/seed-print-catalog.ts paperboy-ja
 *   npx tsx prisma/seed-print-catalog.ts "Paperboy JA"
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { copyAllTemplatesToStore } from "../src/lib/config-products/copy-template";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) {
    console.error(
      'Usage: npx tsx prisma/seed-print-catalog.ts <store-slug-or-name>\nExample: npx tsx prisma/seed-print-catalog.ts paperboy-ja',
    );
    process.exit(1);
  }

  const slugGuess = slugify(query);
  const store = await prisma.store.findFirst({
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

  if (!store) {
    const recent = await prisma.store.findMany({
      select: { name: true, slug: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    console.error(`No shop matched "${query}". Recent shops:`);
    for (const row of recent) {
      console.error(`  ${row.slug}  (${row.name})`);
    }
    process.exit(1);
  }

  console.log(
    `Copying print catalog into ${store.name} (/${store.slug}) — currently ${store._count.configProducts} print products`,
  );
  const result = await copyAllTemplatesToStore(store.id);
  console.log(
    `Done. Added ${result.added}, skipped ${result.skipped} already present.`,
  );
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
