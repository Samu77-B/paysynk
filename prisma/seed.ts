import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient, type ProductKind } from "../src/generated/prisma/client";

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
  variants: VariantSeed[];
}) {
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
        images: [],
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
      images: [],
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

function teeVariants(
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

async function main() {
  const store = await prisma.store.upsert({
    where: { slug: "slf" },
    update: {
      name: "Saturday Love Funk",
      currency: "gbp",
      shippingFlatMinor: 525,
      paymentProvider: "stripe",
      stripeConfigNotes:
        "MVP: platform STRIPE_SECRET_KEY in env. TODO: Stripe Connect / per-merchant keys.",
    },
    create: {
      slug: "slf",
      name: "Saturday Love Funk",
      currency: "gbp",
      shippingFlatMinor: 525,
      paymentProvider: "stripe",
      stripeConfigNotes:
        "MVP: platform STRIPE_SECRET_KEY in env. TODO: Stripe Connect / per-merchant keys.",
    },
  });

  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.merchantUser.upsert({
    where: { email: "merchant@slf.test" },
    update: { passwordHash, storeId: store.id, name: "SLF Merchant" },
    create: {
      email: "merchant@slf.test",
      passwordHash,
      name: "SLF Merchant",
      storeId: store.id,
    },
  });

  await upsertProduct({
    storeId: store.id,
    title: "Classic T-shirt",
    description: "Soft classic tee. 15 GBP each; bundles with tote for 20 GBP.",
    kind: "tee",
    priceMinor: 1500,
    variants: teeVariants("SLF-CLASSIC", [
      { colour: "Red", sizes: { S: 3, M: 3, L: 4 } },
      { colour: "Green", sizes: { S: 2 } },
      { colour: "Royal Blue", sizes: { S: 2 } },
      { colour: "Beige", sizes: { S: 3, M: 3, L: 3 } },
      { colour: "Brown", sizes: { S: 2, M: 0, L: 2, XL: 1 } },
      { colour: "Grey", sizes: { S: 1, M: 0, L: 1, XL: 1 } },
      { colour: "Petrol Blue", sizes: { S: 2, M: 2, L: 0, XL: 1 } },
    ]),
  });

  await upsertProduct({
    storeId: store.id,
    title: "2024 Retro T-shirt",
    description: "2024 retro print tee.",
    kind: "tee",
    priceMinor: 1500,
    variants: teeVariants("SLF-RETRO24", [
      { colour: "Black", sizes: { S: 5, M: 1, L: 0, XL: 0 } },
    ]),
  });

  await upsertProduct({
    storeId: store.id,
    title: "Tote bag",
    description: "Canvas tote. 8 GBP; bundles with a tee for 20 GBP.",
    kind: "tote",
    priceMinor: 800,
    variants: [
      {
        sku: "SLF-TOTE",
        stockQty: 38,
      },
    ],
  });

  console.log("Seeded store slf (Saturday Love Funk)");
  console.log("Merchant login: merchant@slf.test / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
