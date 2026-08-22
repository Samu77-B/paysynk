import { prisma } from "@/lib/prisma";
import { PRINT_TEMPLATES } from "@/lib/config-products/templates";
import type {
  TemplateDefinition,
  TemplateVariationDef,
} from "@/lib/config-products/types";

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
  const optionNameToId = new Map<string, string>();
  const labelToValueId = new Map<string, string>();

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
        create: (definition.options ?? []).map((option, optionIndex) => ({
          name: option.name,
          required: option.required !== false,
          sort: optionIndex,
          values: {
            create: option.values.map((value, valueIndex) => ({
              label: value.label,
              sort: valueIndex,
              modifierKind: value.modifierKind ?? "none",
              modifierValue: value.modifierValue ?? 0,
            })),
          },
        })),
      },
    },
    include: { options: { include: { values: true } } },
  });

  for (const option of product.options) {
    optionNameToId.set(option.name, option.id);
    for (const value of option.values) {
      labelToValueId.set(`${option.name}::${value.label}`, value.id);
    }
  }

  const variations = definition.variations ?? [];
  if (variations.length) {
    await prisma.configVariation.createMany({
      data: variations.map((row, index) =>
        variationCreate(product.id, row, index, optionNameToId, labelToValueId),
      ),
    });
  }

  return product.id;
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
