import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient, type ProductKind } from "../src/generated/prisma/client";
import { seedConfigTemplates, copyTemplateToStore } from "../src/lib/config-products/copy-template";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type VariantSeed = {
  colour?: string;
  size?: string;
  stockQty: number;
  sku: string;
};

async function upsertProduct(opts: {
  storeId: string;
  title: string;
  description: string;
  kind: ProductKind;
  priceMinor: number;
  images?: string[];
  variants: VariantSeed[];
}) {
  const images = opts.images ?? [];
  const existing = await prisma.product.findFirst({
    where: { storeId: opts.storeId, title: opts.title },
    include: { variants: true },
  });

  if (existing) {
    await prisma.variant.deleteMany({ where: { productId: existing.id } });
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        description: opts.description,
        kind: opts.kind,
        active: true,
        images,
        variants: {
          create: opts.variants.map((v) => ({
            sku: v.sku,
            stockQty: v.stockQty,
            priceMinor: opts.priceMinor,
            options: {
              ...(v.colour ? { colour: v.colour } : {}),
              ...(v.size ? { size: v.size } : {}),
            },
          })),
        },
      },
    });
    return;
  }

  await prisma.product.create({
    data: {
      storeId: opts.storeId,
      title: opts.title,
      description: opts.description,
      kind: opts.kind,
      active: true,
      images,
      variants: {
        create: opts.variants.map((v) => ({
          sku: v.sku,
          stockQty: v.stockQty,
          priceMinor: opts.priceMinor,
          options: {
            ...(v.colour ? { colour: v.colour } : {}),
            ...(v.size ? { size: v.size } : {}),
          },
        })),
      },
    },
  });
}

function colourSizeVariants(
  prefix: string,
  rows: Array<{ colour: string; sizes: Record<string, number> }>,
): VariantSeed[] {
  const out: VariantSeed[] = [];
  for (const row of rows) {
    for (const [size, stockQty] of Object.entries(row.sizes)) {
      const colourCode = row.colour.replace(/\s+/g, "").toUpperCase().slice(0, 8);
      out.push({
        colour: row.colour,
        size,
        stockQty,
        sku: `${prefix}-${colourCode}-${size}`,
      });
    }
  }
  return out;
}

function colourVariants(
  prefix: string,
  rows: Array<{ colour: string; stockQty: number }>,
): VariantSeed[] {
  return rows.map((row) => {
    const colourCode = row.colour.replace(/\s+/g, "").toUpperCase().slice(0, 8);
    return {
      colour: row.colour,
      stockQty: row.stockQty,
      sku: `${prefix}-${colourCode}`,
    };
  });
}

const ACME_TITLES = [
  "Acme Minimalist Heavyweight Hoodie",
  "Acme Insulated Steel Water Bottle (750ml)",
  "Acme Artisan Ceramic Mug Set",
] as const;

async function main() {
  const store = await prisma.store.upsert({
    where: { slug: "slf" },
    update: {
      name: "Acme Store",
      currency: "gbp",
      shippingFlatMinor: 525,
      paymentProvider: "stripe",
      signupStatus: "approved",
      stripeConfigNotes:
        "MVP: platform STRIPE_SECRET_KEY in env. TODO: Stripe Connect / per-merchant keys.",
    },
    create: {
      slug: "slf",
      name: "Acme Store",
      currency: "gbp",
      shippingFlatMinor: 525,
      paymentProvider: "stripe",
      signupStatus: "approved",
      stripeConfigNotes:
        "MVP: platform STRIPE_SECRET_KEY in env. TODO: Stripe Connect / per-merchant keys.",
    },
  });

  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.merchantUser.upsert({
    where: { email: "merchant@slf.test" },
    update: { passwordHash, storeId: store.id, name: "Acme Merchant" },
    create: {
      email: "merchant@slf.test",
      passwordHash,
      name: "Acme Merchant",
      storeId: store.id,
    },
  });

  // Remove retired demo products so only the Acme catalogue remains.
  await prisma.product.deleteMany({
    where: {
      storeId: store.id,
      title: { notIn: [...ACME_TITLES] },
    },
  });

  // Hoodie: 85 units across 3 colours × 4 sizes
  await upsertProduct({
    storeId: store.id,
    title: "Acme Minimalist Heavyweight Hoodie",
    description:
      "450gsm organic French terry cotton. Boxy oversized fit with subtle tonal Acme chest embroidery.",
    kind: "other",
    priceMinor: 6500,
    images: [
      "/products/Acme Hoodie Off White.png",
      "/products/acme-minimalist-heavyweight-hoodie.png",
      "/products/Acme Hoodie Forrest Green.png",
    ],
    variants: colourSizeVariants("ACME-HOODIE", [
      { colour: "Off-White", sizes: { S: 7, M: 7, L: 7, XL: 7 } },
      { colour: "Charcoal Black", sizes: { S: 7, M: 8, L: 7, XL: 7 } },
      { colour: "Forest Green", sizes: { S: 7, M: 7, L: 7, XL: 7 } },
    ]),
  });

  // Bottle: 200 units across 3 colours
  await upsertProduct({
    storeId: store.id,
    title: "Acme Insulated Steel Water Bottle (750ml)",
    description:
      "Double-wall vacuum insulation keeps drinks cold for 24 hours or hot for 12 hours. BPA-free stainless steel.",
    kind: "other",
    priceMinor: 2200,
    images: [
      "/products/acme-insulated-steel-water-bottle.png",
      "/products/Acme Water Bottle Raw Silver.png",
      "/products/Acme Water Bottle Sage Green.png",
    ],
    variants: colourVariants("ACME-BOTTLE", [
      { colour: "Matte Black", stockQty: 67 },
      { colour: "Raw Silver", stockQty: 67 },
      { colour: "Sage Green", stockQty: 66 },
    ]),
  });

  // Mug set: 30 units, single SKU
  await upsertProduct({
    storeId: store.id,
    title: "Acme Artisan Ceramic Mug Set",
    description:
      "Hand-thrown speckled stoneware mugs. Set of 2 with ergonomic thumb rests. Microwave and dishwasher safe.",
    kind: "other",
    priceMinor: 3400,
    images: ["/products/acme-artisan-ceramic-mug-set.png"],
    variants: [
      {
        sku: "ACME-MUG-SET",
        stockQty: 30,
      },
    ],
  });

  console.log("Seeded store slf (Acme Store)");
  console.log("Merchant login: merchant@slf.test / password123");

  await seedConfigTemplates();
  const templates = await prisma.configTemplate.findMany({
    where: { slug: { in: ["colour-bw-printing", "business-cards"] } },
  });
  for (const template of templates) {
    const existing = await prisma.configProduct.findFirst({
      where: { storeId: store.id, slug: template.slug },
    });
    if (!existing) {
      await copyTemplateToStore({ storeId: store.id, templateId: template.id });
    }
  }
  console.log("Seeded print templates + Colour/BW Printing and Business Cards on slf");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
