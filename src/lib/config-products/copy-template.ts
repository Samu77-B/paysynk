import { prisma } from "@/lib/prisma";
import { PRINT_TEMPLATES } from "@/lib/config-products/templates";
import type {
  TemplateDefinition,
  TemplateOptionDef,
  TemplateVariationDef,
} from "@/lib/config-products/types";
import type { ModifierKind } from "@/generated/prisma/client";

export function slugifyConfig(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "product"
  );
}

export async function uniqueConfigSlug(storeId: string, base: string) {
  const root = slugifyConfig(base);
  let slug = root;
  let n = 2;
  while (
    await prisma.configProduct.findUnique({
      where: { storeId_slug: { storeId, slug } },
    })
  ) {
    slug = `${root}-${n}`;
    n += 1;
  }
  return slug;
}

export async function seedConfigTemplates() {
  const slugs = PRINT_TEMPLATES.map((t) => t.slug);
  for (const t of PRINT_TEMPLATES) {
    await prisma.configTemplate.upsert({
      where: { slug: t.slug },
      update: {
        title: t.title,
        category: t.category,
        description: t.description,
        sku: t.sku,
        basePriceMinor: t.basePriceMinor,
        uploadsEnabled: t.uploadsEnabled,
        instructionsEnabled: t.instructionsEnabled,
        definition: t.definition,
        sort: t.sort,
      },
      create: {
        slug: t.slug,
        title: t.title,
        category: t.category,
        description: t.description,
        sku: t.sku,
        basePriceMinor: t.basePriceMinor,
        uploadsEnabled: t.uploadsEnabled,
        instructionsEnabled: t.instructionsEnabled,
        definition: t.definition,
        sort: t.sort,
      },
    });
  }
  if (slugs.length) {
    await prisma.configTemplate.deleteMany({
      where: { slug: { notIn: slugs } },
    });
  }
}

function optionsCreateData(options: TemplateOptionDef[]) {
  return options.map((option, optionIndex) => ({
    name: option.name,
    required: option.required !== false,
    sort: optionIndex,
    values: {
      create: option.values.map((value, valueIndex) => ({
        label: value.label,
        sort: valueIndex,
        modifierKind: (value.modifierKind ?? "none") as ModifierKind,
        modifierValue: value.modifierValue ?? 0,
        imageUrl: value.imageUrl ?? null,
      })),
    },
  }));
}

function mapsFromOptions(
  options: Array<{
    id: string;
    name: string;
    values: Array<{ id: string; label: string }>;
  }>,
) {
  const optionNameToId = new Map<string, string>();
  const labelToValueId = new Map<string, string>();
  for (const option of options) {
    optionNameToId.set(option.name, option.id);
    for (const value of option.values) {
      labelToValueId.set(`${option.name}::${value.label}`, value.id);
    }
  }
  return { optionNameToId, labelToValueId };
}

function variationCreate(
  productId: string,
  row: TemplateVariationDef,
  index: number,
  optionNameToId: Map<string, string>,
  labelToValueId: Map<string, string>,
) {
  const match: Record<string, string> = {};
  for (const [optionName, label] of Object.entries(row.matchLabels)) {
    const optionId = optionNameToId.get(optionName);
    if (!optionId) continue;
    if (label === "*") {
      match[optionId] = "*";
      continue;
    }
    const valueId = labelToValueId.get(`${optionName}::${label}`);
    if (valueId) match[optionId] = valueId;
  }
  return {
    productId,
    match,
    priceMinor: row.priceMinor,
    sku: row.sku ?? "",
    sort: index,
  };
}

type VariationWriter = {
  configVariation: {
    createMany: (args: {
      data: ReturnType<typeof variationCreate>[];
    }) => Promise<unknown>;
  };
};

async function writeVariations(
  db: VariationWriter,
  productId: string,
  definition: TemplateDefinition,
  options: Array<{
    id: string;
    name: string;
    values: Array<{ id: string; label: string }>;
  }>,
) {
  const variations = definition.variations ?? [];
  if (!variations.length) return;
  const { optionNameToId, labelToValueId } = mapsFromOptions(options);
  await db.configVariation.createMany({
    data: variations.map((row, index) =>
      variationCreate(productId, row, index, optionNameToId, labelToValueId),
    ),
  });
}

export async function copyTemplateToStore(opts: {
  storeId: string;
  templateId: string;
}) {
  const template = await prisma.configTemplate.findUnique({
    where: { id: opts.templateId },
  });
  if (!template) throw new Error("Template not found");

  const definition = template.definition as TemplateDefinition;
  const slug = await uniqueConfigSlug(opts.storeId, template.slug);

  const product = await prisma.configProduct.create({
    data: {
      storeId: opts.storeId,
      slug,
      title: template.title,
      sku: template.sku,
      description: template.description,
      category: template.category,
      active: true,
      basePriceMinor: template.basePriceMinor,
      uploadsEnabled: template.uploadsEnabled,
      instructionsEnabled: template.instructionsEnabled,
      options: {
        create: optionsCreateData(definition.options ?? []),
      },
    },
    include: { options: { include: { values: true } } },
  });

  await writeVariations(prisma, product.id, definition, product.options);
  return product.id;
}

export type UpsertTemplateResult = {
  productId: string;
  created: boolean;
};

/**
 * Idempotent write of one platform template onto a shop.
 * Matches by (storeId, slug). Replaces option groups and variation prices
 * so re-runs stay in sync with the catalog without duplicating products.
 * Leaves existing photos and “you may also like” links untouched.
 */
export async function upsertTemplateToStore(opts: {
  storeId: string;
  templateId: string;
}): Promise<UpsertTemplateResult> {
  const template = await prisma.configTemplate.findUnique({
    where: { id: opts.templateId },
  });
  if (!template) throw new Error("Template not found");

  const definition = template.definition as TemplateDefinition;
  const existing = await prisma.configProduct.findUnique({
    where: {
      storeId_slug: { storeId: opts.storeId, slug: template.slug },
    },
    select: { id: true },
  });

  const product = await prisma.$transaction(
    async (tx) => {
      const row = existing
        ? await tx.configProduct.update({
            where: { id: existing.id },
            data: {
              title: template.title,
              sku: template.sku,
              description: template.description,
              category: template.category,
              active: true,
              basePriceMinor: template.basePriceMinor,
              uploadsEnabled: template.uploadsEnabled,
              instructionsEnabled: template.instructionsEnabled,
            },
          })
        : await tx.configProduct.create({
            data: {
              storeId: opts.storeId,
              slug: template.slug,
              title: template.title,
              sku: template.sku,
              description: template.description,
              category: template.category,
              active: true,
              basePriceMinor: template.basePriceMinor,
              uploadsEnabled: template.uploadsEnabled,
              instructionsEnabled: template.instructionsEnabled,
            },
          });

      await tx.configVariation.deleteMany({ where: { productId: row.id } });
      await tx.configOption.deleteMany({ where: { productId: row.id } });

      const withOptions = await tx.configProduct.update({
        where: { id: row.id },
        data: {
          options: { create: optionsCreateData(definition.options ?? []) },
        },
        include: { options: { include: { values: true } } },
      });

      await writeVariations(tx, withOptions.id, definition, withOptions.options);
      return withOptions;
    },
    { timeout: 20_000 },
  );

  return { productId: product.id, created: !existing };
}

/** Copies every platform print template into a shop. Skips slugs already present. */
export async function copyAllTemplatesToStore(storeId: string) {
  await seedConfigTemplates();
  const templates = await prisma.configTemplate.findMany({
    orderBy: [{ sort: "asc" }, { title: "asc" }],
  });
  const existing = await prisma.configProduct.findMany({
    where: { storeId },
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((row) => row.slug));
  const added: string[] = [];
  const skipped: string[] = [];

  for (const template of templates) {
    if (existingSlugs.has(template.slug)) {
      skipped.push(template.slug);
      continue;
    }
    await copyTemplateToStore({ storeId, templateId: template.id });
    existingSlugs.add(template.slug);
    added.push(template.slug);
  }

  return { added: added.length, skipped: skipped.length, addedSlugs: added };
}

export type UpsertAllTemplatesResult = {
  added: number;
  updated: number;
  addedSlugs: string[];
  updatedSlugs: string[];
};

/** Upserts every platform print template onto a shop. Safe to re-run. */
export async function upsertAllTemplatesToStore(
  storeId: string,
): Promise<UpsertAllTemplatesResult> {
  await seedConfigTemplates();
  const templates = await prisma.configTemplate.findMany({
    orderBy: [{ sort: "asc" }, { title: "asc" }],
  });
  const addedSlugs: string[] = [];
  const updatedSlugs: string[] = [];

  for (const template of templates) {
    const result = await upsertTemplateToStore({
      storeId,
      templateId: template.id,
    });
    if (result.created) addedSlugs.push(template.slug);
    else updatedSlugs.push(template.slug);
  }

  return {
    added: addedSlugs.length,
    updated: updatedSlugs.length,
    addedSlugs,
    updatedSlugs,
  };
}
