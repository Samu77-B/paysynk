/**
 * Catalog seed for JoJo & Flo London (`jojo-flo-london`).
 * Uses @neondatabase/serverless over HTTPS because Neon pooler TCP is
 * unreliable from some networks. Install if missing:
 * `npm i --no-save @neondatabase/serverless`
 *
 * Run: npx tsx prisma/seed-jojo-flo.ts
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const STORE_ID = "cmtbbv1k5000004jzbx1wq1s3";
const PLACEHOLDER = "/products/jojo-flo/placeholder.png";
const KEEP_TITLE = "Shu Uemura Art of Hair — Ultimate Reset";

function newId() {
  return `c${Date.now().toString(36)}${randomBytes(7).toString("hex")}`;
}

type SizeSku = { size: string; sku: string };

type CatalogProduct = {
  title: string;
  category: string;
  description: string;
  sku?: string;
  sizes?: SizeSku[];
};

const catalog: CatalogProduct[] = [
  {
    title: "Shu Uemura Art of Hair — Izumi Tonic",
    category: "Featured",
    description:
      "Strengthening care from the Izumi Tonic line — fortifies hair from root to tip. Choose shampoo, conditioner or energizing water. Price to follow; ask the JOJO & FLO team which size suits you.",
    sizes: [
      { size: "Shampoo 300ml", sku: "SHU-IZUMI-SH300" },
      { size: "Conditioner 250ml", sku: "SHU-IZUMI-CD250" },
      { size: "Energizing Water 150ml", sku: "SHU-IZUMI-EW150" },
    ],
  },
  {
    title: "Kérastase Première Concentré Décalcifiant Ultra-Réparateur 45ml",
    category: "Featured",
    description:
      "Pre-shampoo treatment from the Première line. Helps remove calcium build-up from hard water and repair damaged, colour-treated hair. Apply on wet hair, leave 5 minutes, then shampoo. 45ml. Price to follow.",
    sku: "3474637196738",
  },
  {
    title: "Davines NOUNOU Hair Mask 75ml",
    category: "Featured",
    description:
      "Nourishing mask for damaged or chemically treated hair. The 75ml size is ideal to take home after a salon treatment. Price to follow.",
    sku: "75111",
  },
  {
    title: "Davines DEDE Shampoo 250ml",
    category: "Davines",
    description:
      "Gentle daily shampoo for all hair types. Softly cleanses without stripping, so hair feels light and fresh. 250ml. Price to follow.",
    sku: "DAV-DEDE-SH250",
  },
  {
    title: "Davines MINU Shampoo 250ml",
    category: "Davines",
    description:
      "Colour-protecting shampoo that helps keep colour vibrant and hair soft. 250ml. Price to follow.",
    sku: "DAV-MINU-SH250",
  },
  {
    title: "Davines LOVE CURL Primer 150ml",
    category: "Davines",
    description:
      "Lightweight primer to define, hydrate and prepare curls before styling. 150ml. Price to follow.",
    sku: "DAV-LOVE-PR150",
  },
  {
    title: "Davines MOMO Conditioner 250ml",
    category: "Davines",
    description:
      "Weightless conditioner that boosts moisture without flattening the hair. 250ml. Price to follow.",
    sku: "DAV-MOMO-CD250",
  },
  {
    title: "Shu Uemura Art of Hair — Ashita Supreme",
    category: "Shu Uemura Art of Hair",
    description:
      "Intense revitalisation with Ashitaba. The line includes shampoo, conditioner and treatment — several sizes. Price to follow; we will add SKUs as stock is confirmed.",
    sizes: [
      { size: "Shampoo 300ml", sku: "SHU-ASHITA-SH300" },
      { size: "Conditioner 250ml", sku: "SHU-ASHITA-CD250" },
      { size: "Treatment 200ml", sku: "SHU-ASHITA-TR200" },
    ],
  },
  {
    title: "Shu Uemura Art of Hair — Deep Cleansing Shampoo",
    category: "Shu Uemura Art of Hair",
    description:
      "Purifying cleanse to lift product build-up and impurities. Several bottle sizes. Price to follow.",
    sizes: [
      { size: "400ml", sku: "SHU-DEEP-400" },
      { size: "750ml", sku: "SHU-DEEP-750" },
    ],
  },
  {
    title: "Shu Uemura Art of Hair — Essence Absolu",
    category: "Shu Uemura Art of Hair",
    description:
      "Nourishing oil for dry or distressed hair. Adds softness and shine. Several sizes. Price to follow.",
    sizes: [
      { size: "Oil 30ml", sku: "SHU-ESSENCE-30" },
      { size: "Oil 100ml", sku: "SHU-ESSENCE-100" },
    ],
  },
  {
    title: "Shu Uemura Art of Hair — Muroto Volume",
    category: "Shu Uemura Art of Hair",
    description:
      "Lightweight volume for fine hair, inspired by Muroto’s mineral waters. Shampoo, conditioner and mist sizes. Price to follow.",
    sizes: [
      { size: "Shampoo 300ml", sku: "SHU-MUROTO-SH300" },
      { size: "Conditioner 250ml", sku: "SHU-MUROTO-CD250" },
      { size: "Fine Hair Mist 125ml", sku: "SHU-MUROTO-MST125" },
    ],
  },
  {
    title: "Shu Uemura Art of Hair — Silk Bloom",
    category: "Shu Uemura Art of Hair",
    description:
      "Repair and shine for colour-treated or damaged hair. Shampoo, conditioner and treatment sizes. Price to follow.",
    sizes: [
      { size: "Shampoo 300ml", sku: "SHU-SILK-SH300" },
      { size: "Conditioner 250ml", sku: "SHU-SILK-CD250" },
      { size: "Restorative Treatment 180ml", sku: "SHU-SILK-TR180" },
    ],
  },
  {
    title: "Shu Uemura Art of Hair — Urban Moisture",
    category: "Shu Uemura Art of Hair",
    description:
      "Hydration for dry hair in city life. Shampoo, conditioner and treatment sizes. Price to follow.",
    sizes: [
      { size: "Shampoo 300ml", sku: "SHU-URBAN-SH300" },
      { size: "Conditioner 250ml", sku: "SHU-URBAN-CD250" },
      { size: "Hydro-Nourishing Treatment 200ml", sku: "SHU-URBAN-TR200" },
    ],
  },
  {
    title: "Shu Uemura Art of Hair — Yubi Blonde",
    category: "Shu Uemura Art of Hair",
    description:
      "Blonde-specific care to tone, brighten and add glow. Purple shampoo, conditioner and oil sizes. Price to follow.",
    sizes: [
      { size: "Purple Shampoo 300ml", sku: "SHU-YUBI-SH300" },
      { size: "Conditioner 250ml", sku: "SHU-YUBI-CD250" },
      { size: "Glow Revealing Oil 30ml", sku: "SHU-YUBI-OIL30" },
    ],
  },
];

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const store = await sql`
    select id, slug, name from "Store" where id = ${STORE_ID} limit 1
  `;
  if (!store[0]) {
    throw new Error("JoJo & Flo London store not found");
  }
  console.log("Seeding", store[0].name, store[0].slug);

  await sql`
    update "Product"
    set category = 'Featured', "updatedAt" = now()
    where id = 'cmtbeh0yf001d04i8dr5a6qhg'
      and "storeId" = ${STORE_ID}
  `;
  console.log("Updated Featured category on existing Ultimate Reset");

  for (const item of catalog) {
    if (item.title === KEEP_TITLE) continue;

    const existing = await sql`
      select id from "Product"
      where "storeId" = ${STORE_ID} and title = ${item.title}
      limit 1
    `;

    const productId = existing[0]?.id ?? newId();
    const imagesLiteral = `{${PLACEHOLDER}}`;

    if (existing[0]) {
      await sql`
        update "Product"
        set
          description = ${item.description},
          category = ${item.category},
          images = ${imagesLiteral}::text[],
          active = true,
          "updatedAt" = now()
        where id = ${productId}
      `;
      await sql`delete from "Variant" where "productId" = ${productId}`;
    } else {
      await sql`
        insert into "Product" (
          id, "storeId", title, description, images, category, active, kind, "createdAt", "updatedAt"
        ) values (
          ${productId},
          ${STORE_ID},
          ${item.title},
          ${item.description},
          ${imagesLiteral}::text[],
          ${item.category},
          true,
          'other'::"ProductKind",
          now(),
          now()
        )
      `;
    }

    const variants = item.sizes?.length
      ? item.sizes
      : [{ size: "", sku: item.sku || `${item.title.slice(0, 12).toUpperCase()}-SKU` }];

    for (const variant of variants) {
      const options = variant.size ? { size: variant.size } : {};
      await sql`
        insert into "Variant" (id, "productId", sku, "priceMinor", "stockQty", options, "imageUrl")
        values (
          ${newId()},
          ${productId},
          ${variant.sku},
          0,
          20,
          ${JSON.stringify(options)}::jsonb,
          ${PLACEHOLDER}
        )
      `;
    }

    console.log(
      existing[0] ? "Updated" : "Created",
      item.title,
      `(${variants.length} SKU${variants.length === 1 ? "" : "s"})`,
    );
  }

  const counts = await sql`
    select category, count(*)::int as n
    from "Product"
    where "storeId" = ${STORE_ID}
    group by category
    order by category
  `;
  console.log("Category counts", counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
