import type { ModifierKind } from "@/generated/prisma/client";

export type ConfigOptionValueInput = {
  id?: string;
  label: string;
  sort: number;
  modifierKind: ModifierKind;
  modifierValue: number;
  imageUrl?: string | null;
};

export type ConfigOptionInput = {
  id?: string;
  name: string;
  required: boolean;
  sort: number;
  values: ConfigOptionValueInput[];
};

export type ConfigVariationInput = {
  id?: string;
  /** optionId -> valueId or "*" */
  match: Record<string, string>;
  priceMinor: number;
  sku: string;
  sort: number;
};

export type ConfigProductPayload = {
  id?: string;
  title: string;
  slug?: string;
  sku: string;
  description: string;
  images: string[];
  category: string;
  active: boolean;
  basePriceMinor: number;
  uploadsEnabled: boolean;
  instructionsEnabled: boolean;
  options: ConfigOptionInput[];
  variations: ConfigVariationInput[];
  relatedIds: string[];
};

export type PricedConfig = {
  ok: true;
  priceMinor: number;
  sku: string;
  optionsLabel: string;
  breakdown: Array<{ label: string; amountMinor: number }>;
};

export type UnpricedConfig = {
  ok: false;
  error: string;
};

export type ConfigPriceResult = PricedConfig | UnpricedConfig;

export type TemplateOptionValueDef = {
  label: string;
  modifierKind?: ModifierKind;
  modifierValue?: number;
  imageUrl?: string;
};

export type TemplateOptionDef = {
  name: string;
  required?: boolean;
  values: TemplateOptionValueDef[];
};

export type TemplateVariationDef = {
  /** Option name -> value label or "*" */
  matchLabels: Record<string, string>;
  priceMinor: number;
  sku?: string;
};

export type TemplateDefinition = {
  options: TemplateOptionDef[];
  variations?: TemplateVariationDef[];
};
