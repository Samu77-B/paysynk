import { prisma } from "@/lib/prisma";
import type { ModifierKind } from "@/generated/prisma/client";

export type DashboardConfigOptionValue = {
  id: string;
  label: string;
  sort: number;
  modifierKind: ModifierKind;
  modifierValue: number;
};

export type DashboardConfigOption = {
  id: string;
  name: string;
  required: boolean;
  sort: number;
  values: DashboardConfigOptionValue[];
};

export type DashboardConfigVariation = {
  id: string;
  match: Record<string, string>;
  priceMinor: number;
  sku: string;
  sort: number;
};

export type DashboardConfigProduct = {
  id: string;
  slug: string;
  title: string;
  sku: string;
  description: string;
  images: string[];
  category: string;
  active: boolean;
  basePriceMinor: number;
  uploadsEnabled: boolean;
  instructionsEnabled: boolean;
  options: DashboardConfigOption[];
  variations: DashboardConfigVariation[];
  relatedIds: string[];
};

export type DashboardConfigTemplate = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
};

const includeConfig = {
  options: { include: { values: true }, orderBy: { sort: "asc" as const } },
  variations: { orderBy: { sort: "asc" as const } },
  relatedFrom: { orderBy: { sort: "asc" as const } },
} as const;

export function toDashboardConfigProduct(
  product: Awaited<ReturnType<typeof loadConfigProduct>>,
): DashboardConfigProduct {
  if (!product) {
    throw new Error("Missing config product");
  }
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    sku: product.sku,
    description: product.description,
    images: product.images,
    category: product.category,
    active: product.active,
    basePriceMinor: product.basePriceMinor,
    uploadsEnabled: product.uploadsEnabled,
    instructionsEnabled: product.instructionsEnabled,
    options: product.options.map((option) => ({
      id: option.id,
      name: option.name,
      required: option.required,
      sort: option.sort,
      values: [...option.values]
        .sort((a, b) => a.sort - b.sort)
        .map((value) => ({
          id: value.id,
          label: value.label,
          sort: value.sort,
          modifierKind: value.modifierKind,
          modifierValue: value.modifierValue,
        })),
    })),
    variations: product.variations.map((row) => ({
      id: row.id,
      match: (row.match ?? {}) as Record<string, string>,
      priceMinor: row.priceMinor,
      sku: row.sku,
      sort: row.sort,
    })),
    relatedIds: product.relatedFrom.map((row) => row.toProductId),
  };
}

function loadConfigProduct(id: string) {
  return prisma.configProduct.findUnique({
    where: { id },
    include: includeConfig,
  });
}

export async function getMerchantConfigProducts(
  storeId: string,
): Promise<DashboardConfigProduct[]> {
  const rows = await prisma.configProduct.findMany({
    where: { storeId },
    include: includeConfig,
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
  return rows.map(toDashboardConfigProduct);
}

export async function getConfigTemplates(): Promise<DashboardConfigTemplate[]> {
  const rows = await prisma.configTemplate.findMany({
    orderBy: [{ sort: "asc" }, { title: "asc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    description: row.description,
  }));
}
