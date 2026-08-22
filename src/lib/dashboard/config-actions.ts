"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAllowedMediaUrl, sanitizeMediaUrl } from "@/lib/media-url";
import {
  copyTemplateToStore,
  uniqueConfigSlug,
  slugifyConfig,
} from "@/lib/config-products/copy-template";
import {
  toDashboardConfigProduct,
  type DashboardConfigProduct,
} from "@/lib/dashboard/config-data";
import type { ConfigProductPayload } from "@/lib/config-products/types";
import type { ModifierKind } from "@/generated/prisma/client";

function revalidateStore(slug?: string | null) {
  revalidatePath("/app/print");
  if (slug) revalidatePath(`/s/${slug}`);
}

async function requireStore() {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) return { error: "Sign in to manage products." as const };
  return { storeId, slug: session.user.storeSlug };
}

const MODIFIERS = new Set<ModifierKind>(["none", "amount", "percent"]);

export async function addConfigFromTemplate(
  templateId: string,
): Promise<{ productId?: string; error?: string }> {
  const authz = await requireStore();
  if ("error" in authz && authz.error) return { error: authz.error };
  try {
    const productId = await copyTemplateToStore({
      storeId: authz.storeId!,
      templateId,
    });
    revalidateStore(authz.slug);
    return { productId };
  } catch (err) {
    console.error(err);
    return { error: "Could not copy that template." };
  }
}

export async function createBlankConfigProduct(): Promise<{
  productId?: string;
  error?: string;
}> {
  const authz = await requireStore();
  if ("error" in authz && authz.error) return { error: authz.error };
  const slug = await uniqueConfigSlug(authz.storeId!, "new-product");
  const product = await prisma.configProduct.create({
    data: {
      storeId: authz.storeId!,
      slug,
      title: "New product",
      sku: "",
      description: "",
      category: "",
      active: false,
      basePriceMinor: 0,
      uploadsEnabled: true,
      instructionsEnabled: false,
    },
  });
  revalidateStore(authz.slug);
  return { productId: product.id };
}

export async function duplicateConfigProduct(
  id: string,
): Promise<{ productId?: string; error?: string }> {
  const authz = await requireStore();
  if ("error" in authz && authz.error) return { error: authz.error };
  const source = await prisma.configProduct.findFirst({
    where: { id, storeId: authz.storeId },
    include: {
      options: { include: { values: true }, orderBy: { sort: "asc" } },
      variations: { orderBy: { sort: "asc" } },
      relatedFrom: true,
    },
  });
  if (!source) return { error: "Product not found." };

  const slug = await uniqueConfigSlug(authz.storeId!, `${source.slug}-copy`);
  const created = await prisma.configProduct.create({
    data: {
      storeId: authz.storeId!,
      slug,
      title: `${source.title} (copy)`,
      sku: source.sku,
      description: source.description,
      images: source.images,
      category: source.category,
      active: false,
      basePriceMinor: source.basePriceMinor,
      uploadsEnabled: source.uploadsEnabled,
      instructionsEnabled: source.instructionsEnabled,
      options: {
        create: source.options.map((option) => ({
          name: option.name,
          required: option.required,
          sort: option.sort,
          values: {
            create: option.values.map((value) => ({
              label: value.label,
              sort: value.sort,
              modifierKind: value.modifierKind,
              modifierValue: value.modifierValue,
            })),
          },
        })),
      },
    },
    include: { options: { include: { values: true } } },
  });

  const oldToNewOption = new Map<string, string>();
  const oldToNewValue = new Map<string, string>();
  for (const option of source.options) {
    const next = created.options.find(
      (o) => o.name === option.name && o.sort === option.sort,
    );
    if (!next) continue;
    oldToNewOption.set(option.id, next.id);
    for (const value of option.values) {
      const nextVal = next.values.find(
        (v) => v.label === value.label && v.sort === value.sort,
      );
      if (nextVal) oldToNewValue.set(value.id, nextVal.id);
    }
  }

  if (source.variations.length) {
    await prisma.configVariation.createMany({
      data: source.variations.map((row) => {
        const match: Record<string, string> = {};
        for (const [optionId, wanted] of Object.entries(
          (row.match ?? {}) as Record<string, string>,
        )) {
          const nextOption = oldToNewOption.get(optionId);
          if (!nextOption) continue;
          match[nextOption] =
            wanted === "*" ? "*" : (oldToNewValue.get(wanted) ?? "*");
        }
        return {
          productId: created.id,
          match,
          priceMinor: row.priceMinor,
          sku: row.sku,
          sort: row.sort,
        };
      }),
    });
  }

  revalidateStore(authz.slug);
  return { productId: created.id };
}

export async function deleteConfigProduct(
  id: string,
): Promise<{ error?: string }> {
  const authz = await requireStore();
  if ("error" in authz && authz.error) return { error: authz.error };
  await prisma.configProduct.deleteMany({
    where: { id, storeId: authz.storeId },
  });
  revalidateStore(authz.slug);
  return {};
}

export async function saveConfigProduct(
  input: ConfigProductPayload,
): Promise<{ product?: DashboardConfigProduct; error?: string }> {
  const authz = await requireStore();
  if ("error" in authz && authz.error) return { error: authz.error };
  if (!input.title.trim()) return { error: "Title is required." };
  if (
    !Number.isFinite(input.basePriceMinor) ||
    input.basePriceMinor < 0 ||
    input.basePriceMinor > 10_000_000
  ) {
    return { error: "Enter a valid base price." };
  }

  const images = input.images
    .map((url) => sanitizeMediaUrl(url))
    .filter((url): url is string => Boolean(url) && isAllowedMediaUrl(url));

  const existing = input.id
    ? await prisma.configProduct.findFirst({
        where: { id: input.id, storeId: authz.storeId },
      })
    : null;
  if (input.id && !existing) return { error: "Product not found." };

  const slug = existing
    ? existing.slug
    : await uniqueConfigSlug(authz.storeId!, input.slug || input.title);

  const saved = await prisma.$transaction(async (tx) => {
    const product = existing
      ? await tx.configProduct.update({
          where: { id: existing.id },
          data: {
            title: input.title.trim(),
            sku: input.sku.trim(),
            description: input.description,
            images,
            category: input.category.trim(),
            active: input.active,
            basePriceMinor: Math.round(input.basePriceMinor),
            uploadsEnabled: input.uploadsEnabled,
            instructionsEnabled: input.instructionsEnabled,
          },
        })
      : await tx.configProduct.create({
          data: {
            storeId: authz.storeId!,
            slug: slugifyConfig(slug),
            title: input.title.trim(),
            sku: input.sku.trim(),
            description: input.description,
            images,
            category: input.category.trim(),
            active: input.active,
            basePriceMinor: Math.round(input.basePriceMinor),
            uploadsEnabled: input.uploadsEnabled,
            instructionsEnabled: input.instructionsEnabled,
          },
        });

    await tx.configOption.deleteMany({ where: { productId: product.id } });
    await tx.configVariation.deleteMany({ where: { productId: product.id } });
    await tx.configRelated.deleteMany({ where: { fromProductId: product.id } });

    const optionIdMap = new Map<string, string>();
    const valueIdMap = new Map<string, string>();

    for (const [optionIndex, option] of input.options.entries()) {
      const name = option.name.trim();
      if (!name) continue;
      const createdOption = await tx.configOption.create({
        data: {
          productId: product.id,
          name,
          required: option.required,
          sort: option.sort || optionIndex,
        },
      });
      if (option.id) optionIdMap.set(option.id, createdOption.id);
      optionIdMap.set(`idx:${optionIndex}`, createdOption.id);

      for (const [valueIndex, value] of option.values.entries()) {
        const label = value.label.trim();
        if (!label) continue;
        const kind = MODIFIERS.has(value.modifierKind)
          ? value.modifierKind
          : "none";
        const createdValue = await tx.configOptionValue.create({
          data: {
            optionId: createdOption.id,
            label,
            sort: value.sort || valueIndex,
            modifierKind: kind,
            modifierValue: Math.round(value.modifierValue || 0),
          },
        });
        if (value.id) valueIdMap.set(value.id, createdValue.id);
      }
    }

    function remapWanted(optionKey: string, wanted: string) {
      if (!wanted || wanted === "*") return "*";
      return valueIdMap.get(wanted) ?? "*";
    }

    for (const [index, variation] of input.variations.entries()) {
      const match: Record<string, string> = {};
      for (const [optionKey, wanted] of Object.entries(variation.match ?? {})) {
        const nextOption =
          optionIdMap.get(optionKey) ?? optionIdMap.get(`idx:${optionKey}`);
        if (!nextOption) continue;
        match[nextOption] = remapWanted(optionKey, wanted);
      }
      await tx.configVariation.create({
        data: {
          productId: product.id,
          match,
          priceMinor: Math.max(0, Math.round(variation.priceMinor || 0)),
          sku: variation.sku.trim(),
          sort: variation.sort || index,
        },
      });
    }

    const relatedIds = [...new Set(input.relatedIds)].filter(
      (id) => id && id !== product.id,
    );
    if (relatedIds.length) {
      const owned = await tx.configProduct.findMany({
        where: { storeId: authz.storeId, id: { in: relatedIds } },
        select: { id: true },
      });
      await tx.configRelated.createMany({
        data: owned.map((row, index) => ({
          fromProductId: product.id,
          toProductId: row.id,
          sort: index,
        })),
      });
    }

    return tx.configProduct.findUniqueOrThrow({
      where: { id: product.id },
      include: {
        options: { include: { values: true }, orderBy: { sort: "asc" } },
        variations: { orderBy: { sort: "asc" } },
        relatedFrom: { orderBy: { sort: "asc" } },
      },
    });
  });

  revalidateStore(authz.slug);
  return { product: toDashboardConfigProduct(saved) };
}
