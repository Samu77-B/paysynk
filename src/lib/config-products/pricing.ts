import type {
  ConfigOption,
  ConfigOptionValue,
  ConfigProduct,
  ConfigVariation,
} from "@/generated/prisma/client";
import type { ConfigPriceResult } from "@/lib/config-products/types";

export type ConfigProductForPrice = ConfigProduct & {
  options: Array<ConfigOption & { values: ConfigOptionValue[] }>;
  variations: ConfigVariation[];
};

/**
 * Ecwid-style price:
 * 1. First matching variation (top to bottom) replaces the base price.
 *    Missing match keys and "*" are wildcards.
 * 2. Amount modifiers on the selected values are added.
 * 3. Percent modifiers (e.g. Rush +15%) apply to that running total.
 */
export function priceConfigSelection(
  product: ConfigProductForPrice,
  selections: Record<string, string>,
): ConfigPriceResult {
  const options = [...product.options].sort((a, b) => a.sort - b.sort);
  const labels: string[] = [];

  for (const option of options) {
    const valueId = selections[option.id]?.trim();
    if (option.required && !valueId) {
      return { ok: false, error: `Choose ${option.name}.` };
    }
    if (!valueId) continue;
    const value = option.values.find((v) => v.id === valueId);
    if (!value) {
      return { ok: false, error: `Choose a valid ${option.name}.` };
    }
    labels.push(`${option.name}: ${value.label}`);
  }

  const variations = [...product.variations].sort((a, b) => a.sort - b.sort);
  let matched: ConfigVariation | undefined;
  for (const variation of variations) {
    const match = (variation.match ?? {}) as Record<string, string>;
    const ok = Object.entries(match).every(([optionId, wanted]) => {
      if (!wanted || wanted === "*") return true;
      return selections[optionId] === wanted;
    });
    if (ok) {
      matched = variation;
      break;
    }
  }

  let price = matched ? matched.priceMinor : product.basePriceMinor;
  const breakdown: Array<{ label: string; amountMinor: number }> = [
    {
      label: matched ? "Variation price" : "Base price",
      amountMinor: price,
    },
  ];

  let amountMods = 0;
  let percentMods = 0;
  for (const option of options) {
    const valueId = selections[option.id];
    if (!valueId) continue;
    const value = option.values.find((v) => v.id === valueId);
    if (!value) continue;
    if (value.modifierKind === "amount" && value.modifierValue) {
      amountMods += value.modifierValue;
      breakdown.push({
        label: value.label,
        amountMinor: value.modifierValue,
      });
    }
    if (value.modifierKind === "percent" && value.modifierValue) {
      percentMods += value.modifierValue;
    }
  }

  price += amountMods;
  if (percentMods) {
    const extra = Math.round((price * percentMods) / 100);
    price += extra;
    breakdown.push({
      label: `Rush / percent (+${percentMods}%)`,
      amountMinor: extra,
    });
  }

  if (price < 0) {
    return { ok: false, error: "This combination is not available." };
  }

  return {
    ok: true,
    priceMinor: price,
    sku: matched?.sku || product.sku || product.slug,
    optionsLabel: labels.join(" · "),
    breakdown,
  };
}
