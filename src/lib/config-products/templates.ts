import type {
  TemplateDefinition,
  TemplateOptionDef,
  TemplateOptionValueDef,
  TemplateVariationDef,
} from "@/lib/config-products/types";

export type PrintTemplateSeed = {
  slug: string;
  title: string;
  category: string;
  description: string;
  sku: string;
  basePriceMinor: number;
  uploadsEnabled: boolean;
  instructionsEnabled: boolean;
  sort: number;
  definition: TemplateDefinition;
};

export const PRINT_CATEGORY_ORDER = [
  "Business Products",
  "Marketing Material",
  "Events & More",
  "Signs & Printing",
  "ID & Accessories",
] as const;

export function printCategoryRank(name: string): number {
  const index = (PRINT_CATEGORY_ORDER as readonly string[]).indexOf(name);
  return index < 0 ? Number.MAX_SAFE_INTEGER : index;
}

function v(
  label: string,
  extra?: Partial<TemplateOptionValueDef>,
): TemplateOptionValueDef {
  return { label, ...extra };
}

function amt(label: string, modifierValue: number): TemplateOptionValueDef {
  return { label, modifierKind: "amount", modifierValue };
}

function pct(label: string, modifierValue: number): TemplateOptionValueDef {
  return { label, modifierKind: "percent", modifierValue };
}

function opt(
  name: string,
  values: TemplateOptionValueDef[],
  required = true,
): TemplateOptionDef {
  return { name, required, values };
}

function qtyPrices(
  prices: Record<string, number>,
): { option: TemplateOptionDef; variations: TemplateVariationDef[] } {
  const rows = Object.entries(prices);
  return {
    option: opt(
      "Quantity",
      rows.map(([label]) => v(label)),
    ),
    variations: rows.map(([label, priceMinor]) => ({
      matchLabels: { Quantity: label },
      priceMinor,
    })),
  };
}

function keyedPrices(
  optionName: string,
  prices: Record<string, number>,
  otherOptions: TemplateOptionDef[],
): TemplateDefinition {
  const rows = Object.entries(prices);
  return {
    options: [
      opt(
        optionName,
        rows.map(([label]) => v(label)),
      ),
      ...otherOptions,
    ],
    variations: rows.map(([label, priceMinor]) => ({
      matchLabels: { [optionName]: label },
      priceMinor,
    })),
  };
}

function withQuantity(
  options: TemplateOptionDef[],
  prices: Record<string, number>,
  trailing: TemplateOptionDef[] = [],
): TemplateDefinition {
  const qty = qtyPrices(prices);
  return {
    options: [...options, qty.option, ...trailing],
    variations: qty.variations,
  };
}

const RUSH = opt("Rush Charge", [v("No (+0%)"), pct("Yes (+15%)", 15)]);
const SIDES = opt("Printed Sides", [v("Single"), amt("Double", 400)]);
const SIDED = opt("Printed Sides", [
  v("Single Sided"),
  amt("Double Sided", 400),
]);
const ORIENTATION = opt("Orientation", [v("Portrait"), v("Landscape")]);
const FINISH = opt("Finish", [v("Glossy"), v("Matte")]);

const PACK_QTY = { "25": 2500, "50": 4000, "100": 6500, "250": 12000, "500": 20000 };
const SMALL_PACK = { "25": 1800, "50": 2800, "100": 4500, "250": 8500 };
const SINGLE_QTY = { "1": 2500, "2": 4500, "5": 9500, "10": 16000 };
const CARD_QTY = { "100": 2500, "250": 4500, "500": 7500, "1000": 12000 };

function seed(row: PrintTemplateSeed): PrintTemplateSeed {
  return row;
}

export const PRINT_TEMPLATES: PrintTemplateSeed[] = [
  seed({
    slug: "colour-bw-printing",
    title: "BW / Colour Printing",
    category: "Business Products",
    description:
      "Black & white or colour copies on Letter, Legal, and Tabloid. Choose sides, orientation, and rush if you need it today.",
    sku: "00004",
    basePriceMinor: 1800,
    uploadsEnabled: true,
    instructionsEnabled: false,
    sort: 10,
    definition: keyedPrices(
      "Print Type",
      {
        "BW 50": 1800,
        "BW 75": 2500,
        "BW 100": 3200,
        "BW 150": 4500,
        "BW 200": 5800,
        "Colour 50": 8000,
        "Colour 75": 11000,
        "Colour 100": 14000,
        "Colour 150": 19000,
        "Colour 200": 24000,
      },
      [
        opt("Paper Size", [
          v('Letter (8.5" x 11")'),
          amt("Legal", 50),
          amt("Tabloid", 150),
        ]),
        opt("Printed Sides", [v("Single"), amt("Double", 100)]),
        ORIENTATION,
        RUSH,
      ],
    ),
  }),
  seed({
    slug: "business-cards",
    title: "Business Cards",
    category: "Business Products",
    description:
      "Standard, premium luxury, or PVC cards with glossy or matte finish. Upload artwork or add a note for in-house design.",
    sku: "00000",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 30,
    definition: {
      options: [
        opt("Material", [
          v("Standard"),
          amt("Premium Luxury", 800),
          amt("PVC", 1500),
          amt("Glossy Finish", 400),
          v("Matte Finish"),
        ]),
        opt("Printed sides", [v("Single"), amt("Double", 800)]),
        opt("Size", [v("85 × 55mm"), v("90 × 60mm")]),
        ORIENTATION,
        opt("Corners", [v("Normal"), v("Round corners")]),
        qtyPrices(CARD_QTY).option,
        opt(
          "Add boxes?",
          [v("None"), amt("Add boxes", 500)],
          false,
        ),
      ],
      variations: [
        { matchLabels: { Quantity: "100" }, priceMinor: 2500, sku: "BC-100" },
        { matchLabels: { Quantity: "250" }, priceMinor: 4500, sku: "BC-250" },
        { matchLabels: { Quantity: "500" }, priceMinor: 7500, sku: "BC-500" },
        { matchLabels: { Quantity: "1000" }, priceMinor: 12000, sku: "BC-1000" },
      ],
    },
  }),
  seed({
    slug: "booklets",
    title: "Booklets",
    category: "Business Products",
    description:
      "Multi-page booklets with cover stock and binding (saddle, coil, comb, or perfect bound).",
    sku: "PB-BOOKLETS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 40,
    definition: withQuantity(
      [
        opt("Cover / Paper Stock", [
          v("170gsm Silk"),
          amt("250gsm Silk", 400),
          amt("350gsm Card", 700),
          amt("400gsm Card", 900),
        ]),
        opt("Binding Type", [
          v("Saddle stitch"),
          amt("Coil", 600),
          amt("Comb", 400),
          amt("Perfect bound", 800),
        ]),
        SIDES,
        ORIENTATION,
      ],
      { "25": 2800, "50": 4800, "100": 8200, "250": 16000 },
    ),
  }),
  seed({
    slug: "labels",
    title: "Labels & Stickers",
    category: "Business Products",
    description:
      "Custom shapes and sizes with permanent, removable, or outdoor adhesive backing.",
    sku: "PB-LABELS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 50,
    definition: withQuantity(
      [
        opt("Shape", [
          v("Rectangle"),
          v("Circle"),
          v("Oval"),
          amt("Custom Shape", 300),
        ]),
        opt("Size", [
          v("Small"),
          amt("Medium", 200),
          amt("Large", 500),
          amt("Custom", 400),
        ]),
        opt("Adhesive Backing", [
          v("Permanent"),
          v("Removable"),
          amt("Outdoor", 300),
        ]),
      ],
      SMALL_PACK,
    ),
  }),
  seed({
    slug: "reports",
    title: "Reports",
    category: "Business Products",
    description:
      "Bound reports with optional custom card cover, index dividers, and coil or comb binding.",
    sku: "PB-REPORTS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 60,
    definition: withQuantity(
      [
        opt("Cover", [v("Standard"), amt("Custom Card Cover", 600)]),
        opt("Index Dividers", [v("None"), amt("Add index dividers", 400)], false),
        opt("Binding", [
          v("Staple"),
          amt("Coil", 600),
          amt("Comb", 400),
        ]),
        SIDES,
      ],
      { "10": 2800, "25": 4800, "50": 8200, "100": 14000 },
    ),
  }),
  seed({
    slug: "manuals",
    title: "Manuals",
    category: "Business Products",
    description:
      "Technical and training manuals with paper-weight choices, protective covers, and coil or comb binding.",
    sku: "PB-MANUALS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 70,
    definition: withQuantity(
      [
        opt("Paper Weight", [
          v("80gsm Uncoated"),
          amt("100gsm Uncoated", 150),
          amt("130gsm Silk", 300),
        ]),
        opt("Protective Cover", [
          v("None"),
          amt("Acetate cover", 500),
          amt("Card cover", 400),
        ]),
        opt("Binding", [
          v("Coil"),
          amt("Comb", 200),
          v("Staple"),
        ]),
      ],
      { "10": 3200, "25": 5500, "50": 9200, "100": 16000 },
    ),
  }),
  seed({
    slug: "menus",
    title: "Menus",
    category: "Business Products",
    description:
      "Single-page or multi-page menus with lamination and custom folds.",
    sku: "PB-MENUS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 80,
    definition: withQuantity(
      [
        opt("Layout", [v("Single Page"), amt("Multi-page", 800)]),
        opt("Lamination", [
          v("None"),
          amt("Gloss lamination", 500),
          amt("Matte lamination", 500),
        ]),
        opt("Fold", [
          v("No fold"),
          v("Half fold"),
          amt("Custom fold", 200),
        ]),
      ],
      PACK_QTY,
    ),
  }),
  seed({
    slug: "press-kits",
    title: "Press Kits",
    category: "Business Products",
    description: "Presentation folders as a single-pocket or double-pocket kit.",
    sku: "PB-PRESS-KITS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 90,
    definition: withQuantity(
      [
        opt("Folder", [
          v("Single Pocket Folder"),
          amt("Double Pocket Folder", 600),
        ]),
      ],
      { "25": 3500, "50": 6000, "100": 10000, "250": 20000 },
    ),
  }),
  seed({
    slug: "letterheads",
    title: "Letterheads",
    category: "Business Products",
    description: "Branded letterheads on standard letter size or custom paper stock.",
    sku: "PB-LETTERHEADS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 100,
    definition: withQuantity(
      [
        opt("Paper Size", [v("Standard Letter Size"), v("A4")]),
        opt("Paper Stock", [
          v("80gsm Uncoated"),
          amt("100gsm Uncoated", 150),
          amt("Custom Paper Stock", 400),
        ]),
      ],
      { "50": 2200, "100": 3500, "250": 7000, "500": 12000 },
    ),
  }),
  seed({
    slug: "envelopes",
    title: "Envelopes",
    category: "Business Products",
    description: "Standard envelope sizes with optional custom branding.",
    sku: "PB-ENVELOPES",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 110,
    definition: withQuantity(
      [
        opt("Size", [
          v("DL"),
          v("C5"),
          amt("C4", 200),
          v("Standard Envelope Sizes"),
        ]),
        opt("Branding", [v("None"), amt("Custom Branding", 500)], false),
      ],
      { "50": 2000, "100": 3200, "250": 6500, "500": 11000 },
    ),
  }),
  seed({
    slug: "architectural-drawings",
    title: "Architectural Drawings",
    category: "Business Products",
    description: "Blueprint and colour plan prints in A2–A0 and ANSI sizes.",
    sku: "PB-PLANS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 120,
    definition: withQuantity(
      [
        opt("Format", [v("Blueprint"), amt("Full colour plot", 800)]),
        opt("Plan Size", [
          v("A2"),
          amt("A1", 400),
          amt("A0", 900),
          amt("ANSI D", 500),
        ]),
      ],
      { "1": 1200, "5": 4500, "10": 8000, "25": 17500 },
    ),
  }),
  seed({
    slug: "receipt-books",
    title: "Receipt Books",
    category: "Business Products",
    description: "Carbonless NCR multi-part receipt books.",
    sku: "PB-RECEIPT-BOOKS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 130,
    definition: withQuantity(
      [
        opt("Parts", [
          v("2-part NCR"),
          amt("3-part NCR", 600),
          amt("4-part NCR", 1000),
        ]),
      ],
      { "10": 3500, "25": 7000, "50": 12000, "100": 20000 },
    ),
  }),
  seed({
    slug: "comp-slips",
    title: "Comp Slips",
    category: "Business Products",
    description: "Complimentary slips on standard or premium card stock.",
    sku: "PB-COMP-SLIPS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 140,
    definition: withQuantity(
      [
        opt("Stock", [
          v("Standard Card Stock"),
          amt("Premium card", 400),
        ]),
      ],
      { "50": 1800, "100": 2800, "250": 5500, "500": 9000 },
    ),
  }),
  seed({
    slug: "scanning",
    title: "Document Scanning",
    category: "Business Products",
    description: "Digitise paper by page count and resolution. Upload is optional.",
    sku: "PB-SCANNING",
    basePriceMinor: 800,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 145,
    definition: keyedPrices(
      "Page Count",
      {
        "1–10": 800,
        "11–50": 1600,
        "51–100": 2600,
        "100+": 4300,
      },
      [
        opt("Resolution", [
          v("150 DPI"),
          amt("300 DPI", 200),
          amt("600 DPI", 500),
        ]),
      ],
    ),
  }),
  seed({
    slug: "brochures",
    title: "Brochures",
    category: "Marketing Material",
    description:
      "Half, tent, roll, Z, or gate fold brochures in glossy or matte finish.",
    sku: "PB-BROCHURES",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 200,
    definition: withQuantity(
      [
        opt("Fold", [
          v("Half Fold"),
          v("Tent Fold"),
          v("Roll Fold"),
          v("Z-Fold"),
          amt("Gate Fold", 200),
        ]),
        FINISH,
        SIDES,
        ORIENTATION,
      ],
      PACK_QTY,
    ),
  }),
  seed({
    slug: "calendars",
    title: "Calendars",
    category: "Marketing Material",
    description: "Wall or desk calendars, wire or coil bound.",
    sku: "PB-CALENDARS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 210,
    definition: withQuantity(
      [
        opt("Type", [v("Wall Calendar"), v("Desk Calendar")]),
        opt("Binding", [v("Wire / Coil Bound"), v("Saddle stitch")]),
      ],
      { "1": 1800, "10": 12000, "25": 25000, "50": 42000 },
    ),
  }),
  seed({
    slug: "catalogues",
    title: "Catalogues",
    category: "Marketing Material",
    description: "Multi-page catalogues with paper-weight and cover-finish choices.",
    sku: "PB-CATALOGUES",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 220,
    definition: withQuantity(
      [
        opt("Paper Weight", [
          v("130gsm Silk"),
          amt("170gsm Silk", 400),
          amt("250gsm cover", 800),
        ]),
        opt("Cover Finish", [
          v("Glossy"),
          v("Matte"),
          amt("Soft-touch", 400),
        ]),
        opt("Pages", [
          v("Multi-page 8pp"),
          amt("16pp", 1200),
          amt("24pp", 2000),
          amt("32pp", 2800),
        ]),
      ],
      { "25": 4500, "50": 7500, "100": 12500, "250": 25000 },
    ),
  }),
  seed({
    slug: "flyers",
    title: "Flyers",
    category: "Marketing Material",
    description: "Single- or double-sided flyers in glossy or matte finish.",
    sku: "PB-FLYERS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 230,
    definition: withQuantity(
      [
        SIDED,
        FINISH,
        opt("Size", [v("A6"), v("A5"), amt("A4", 300), v('Letter (8.5" x 11")')]),
      ],
      SMALL_PACK,
    ),
  }),
  seed({
    slug: "magazines",
    title: "Magazines",
    category: "Marketing Material",
    description: "Eco or luxury stock magazines with glossy or matte finish.",
    sku: "PB-MAGAZINES",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 240,
    definition: withQuantity(
      [
        opt("Stock", [v("Eco Stock"), amt("Luxury Stock", 800)]),
        opt("Finish", [v("Glossy Finish"), v("Matte")]),
        opt("Pages", [
          v("8pp"),
          amt("16pp", 1200),
          amt("24pp", 2000),
          amt("32pp", 2800),
        ]),
      ],
      { "25": 5000, "50": 8500, "100": 14500, "250": 28000 },
    ),
  }),
  seed({
    slug: "newsletters",
    title: "Newsletters",
    category: "Marketing Material",
    description: "Single-sheet or folded multi-page newsletters.",
    sku: "PB-NEWSLETTERS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 250,
    definition: withQuantity(
      [
        opt("Layout", [v("Single Sheet"), amt("Folded Multi-page", 600)]),
        SIDES,
      ],
      SMALL_PACK,
    ),
  }),
  seed({
    slug: "standees",
    title: "Standees",
    category: "Marketing Material",
    description: "Self-standing display standees in small, medium, and large sizes.",
    sku: "PB-STANDEES",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 260,
    definition: withQuantity(
      [
        opt("Display Size", [
          v("Small"),
          amt("Medium", 1500),
          amt("Large", 3000),
        ]),
      ],
      SINGLE_QTY,
    ),
  }),
  seed({
    slug: "easel-backs",
    title: "Easel Backs",
    category: "Marketing Material",
    description: "Countertop easel-back displays in A5, A4, and A3.",
    sku: "PB-EASEL-BACKS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 270,
    definition: withQuantity(
      [
        opt("Countertop Size", [
          v("A5"),
          amt("A4", 400),
          amt("A3", 800),
        ]),
      ],
      { "1": 1200, "5": 4500, "10": 8000, "25": 16000 },
    ),
  }),
  seed({
    slug: "tent-cards",
    title: "Tent Cards",
    category: "Marketing Material",
    description: "Tabletop tent cards in A6, A5, and A4 fold sizes.",
    sku: "PB-TENT-CARDS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 280,
    definition: withQuantity(
      [
        opt("Tabletop Fold Size", [
          v("A6"),
          amt("A5", 300),
          amt("A4", 600),
        ]),
      ],
      SMALL_PACK,
    ),
  }),
  seed({
    slug: "certificates",
    title: "Certificates",
    category: "Events & More",
    description: "Awards and certificates on specialty paper or card stock.",
    sku: "PB-CERTIFICATES",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 300,
    definition: withQuantity(
      [
        opt("Paper", [v("Specialty Paper"), amt("Card Stock", 300)]),
      ],
      { "10": 1500, "25": 2800, "50": 4500, "100": 7500 },
    ),
  }),
  seed({
    slug: "event-tickets",
    title: "Event Tickets",
    category: "Events & More",
    description: "Tickets with optional perforated stubs and sequential numbering.",
    sku: "PB-TICKETS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 310,
    definition: withQuantity(
      [
        opt("Stub", [v("None"), amt("Perforated Stubs", 200)], false),
        opt(
          "Numbering",
          [v("None"), amt("Custom Sequential Numbering", 400)],
          false,
        ),
      ],
      { "50": 2200, "100": 3500, "250": 7000, "500": 12000, "1000": 20000 },
    ),
  }),
  seed({
    slug: "invitations",
    title: "Invitations",
    category: "Events & More",
    description: "Custom shapes and folds, with optional matching envelopes.",
    sku: "PB-INVITATIONS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 320,
    definition: withQuantity(
      [
        opt("Shape", [v("Rectangle"), amt("Custom Shapes", 400)]),
        opt("Fold", [v("Flat"), amt("Custom Folds", 300)]),
        opt(
          "Envelopes",
          [v("None"), amt("Matching Envelopes", 500)],
          false,
        ),
      ],
      { "25": 2800, "50": 4500, "100": 7500, "250": 15000 },
    ),
  }),
  seed({
    slug: "gift-certificates",
    title: "Gift Certificates",
    category: "Events & More",
    description: "Single- or double-sided gift certificates.",
    sku: "PB-GIFT-CERTS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 330,
    definition: withQuantity([SIDED], SMALL_PACK),
  }),
  seed({
    slug: "greeting-cards",
    title: "Greeting Cards",
    category: "Events & More",
    description: "Half-fold or tent-fold cards, with envelopes included on request.",
    sku: "PB-GREETING-CARDS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 340,
    definition: withQuantity(
      [
        opt("Fold", [v("Half Fold"), v("Tent Fold")]),
        opt(
          "Envelopes",
          [v("None"), amt("Envelopes Included", 400)],
          false,
        ),
      ],
      SMALL_PACK,
    ),
  }),
  seed({
    slug: "wristbands",
    title: "Wristbands",
    category: "Events & More",
    description: "Printable event wristbands in Tyvek, plastic, or custom band materials.",
    sku: "PB-WRISTBANDS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 350,
    definition: withQuantity(
      [
        opt("Material", [
          v("Tyvek"),
          v("Plastic"),
          v("Printable Band Materials"),
        ]),
      ],
      { "50": 2500, "100": 4000, "250": 8500, "500": 15000 },
    ),
  }),
  seed({
    slug: "programs",
    title: "Programs",
    category: "Events & More",
    description: "Event programs in booklet sizes and multi-page counts.",
    sku: "PB-PROGRAMS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 360,
    definition: withQuantity(
      [
        opt("Booklet Size", [v("A5"), amt("A4", 400), v("Booklet Sizes")]),
        opt("Pages", [
          v("Multi-page 8pp"),
          amt("16pp", 800),
          amt("24pp", 1400),
        ]),
      ],
      { "25": 3200, "50": 5500, "100": 9500, "250": 19000 },
    ),
  }),
  seed({
    slug: "sporting-bibs",
    title: "Sporting Bibs",
    category: "Events & More",
    description: "Race bibs on standard or weather-resistant materials.",
    sku: "PB-BIBS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 370,
    definition: withQuantity(
      [
        opt("Material", [
          v("Standard"),
          amt("Weather-resistant Materials", 500),
        ]),
      ],
      { "25": 3500, "50": 6000, "100": 10000, "250": 20000 },
    ),
  }),
  seed({
    slug: "retractable-banners",
    title: "Retractable Banners",
    category: "Signs & Printing",
    description: "Pull-up display stands in common roll-up sizes.",
    sku: "PB-RETRACTABLE",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 400,
    definition: withQuantity(
      [
        opt("Pull-up Display Size", [
          v("850 × 2000mm"),
          amt("1000 × 2000mm", 1500),
          amt("1200 × 2000mm", 2800),
        ]),
      ],
      SINGLE_QTY,
    ),
  }),
  seed({
    slug: "hanging-banners",
    title: "Hanging Banners",
    category: "Signs & Printing",
    description: "Indoor or outdoor vinyl banners with grommet placement options.",
    sku: "PB-HANGING",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 410,
    definition: withQuantity(
      [
        opt("Grommet Placement", [
          v("Corners only"),
          amt("Corners + sides", 300),
        ]),
        opt("Material", [
          v("Indoor Vinyl"),
          amt("Outdoor Vinyl", 600),
        ]),
        opt("Size", [v("Small"), amt("Medium", 1200), amt("Large", 2500)]),
      ],
      SINGLE_QTY,
    ),
  }),
  seed({
    slug: "x-banner-stand",
    title: "X Banner Stand",
    category: "Signs & Printing",
    description: "X-frame display stands in standard poster sizes.",
    sku: "PB-X-BANNER",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 420,
    definition: withQuantity(
      [
        opt("X-Frame Display Size", [
          v("60 × 160cm"),
          amt("80 × 180cm", 1200),
        ]),
      ],
      SINGLE_QTY,
    ),
  }),
  seed({
    slug: "outdoor-banners",
    title: "Outdoor Banners",
    category: "Signs & Printing",
    description: "Adhesive or weather-resistant vinyl for outdoor use.",
    sku: "PB-OUTDOOR",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 430,
    definition: withQuantity(
      [
        opt("Material", [
          v("Adhesive Vinyl"),
          v("Weather-resistant Vinyl"),
        ]),
        opt("Size", [v("Small"), amt("Medium", 1200), amt("Large", 2500)]),
      ],
      SINGLE_QTY,
    ),
  }),
  seed({
    slug: "photo-prints",
    title: "Photo Prints",
    category: "Signs & Printing",
    description: "Album inserts or wall art on glossy or luster photo paper.",
    sku: "PB-PHOTO",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 440,
    definition: withQuantity(
      [
        opt("Style", [v("Album Inserts"), amt("Wall Art", 800)]),
        opt("Finish", [v("Glossy"), v("Luster")]),
        opt("Size", [
          v("4 × 6"),
          amt("5 × 7", 200),
          amt("8 × 10", 500),
          amt("A4", 700),
        ]),
      ],
      { "1": 400, "10": 2800, "25": 5500, "50": 9000 },
    ),
  }),
  seed({
    slug: "posters",
    title: "Posters",
    category: "Signs & Printing",
    description: "Small, medium, and large-format posters.",
    sku: "PB-POSTERS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 450,
    definition: withQuantity(
      [
        opt("Size", [
          v("Small"),
          amt("Medium", 800),
          amt("Large Format", 2000),
        ]),
        FINISH,
      ],
      { "1": 1500, "5": 5500, "10": 9500, "25": 20000 },
    ),
  }),
  seed({
    slug: "canvas-printing",
    title: "Canvas Printing",
    category: "Signs & Printing",
    description: "Mounted or stretched canvas prints.",
    sku: "PB-CANVAS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 460,
    definition: withQuantity(
      [
        opt("Type", [v("Mounted Canvas"), amt("Stretched Canvas", 1200)]),
        opt("Size", [
          v("12 × 16"),
          amt("16 × 20", 800),
          amt("20 × 24", 1500),
          amt("24 × 36", 2400),
        ]),
      ],
      { "1": 4500, "2": 8000, "5": 18000 },
    ),
  }),
  seed({
    slug: "pvc-id-cards",
    title: "PVC ID Cards",
    category: "ID & Accessories",
    description: "Credit-card size PVC IDs, single or double sided.",
    sku: "PB-PVC-ID",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 500,
    definition: withQuantity([SIDES], SMALL_PACK),
  }),
  seed({
    slug: "composite-id-cards",
    title: "Composite ID Cards",
    category: "ID & Accessories",
    description: "Durable composite ID cards for high-wear use.",
    sku: "PB-COMPOSITE-ID",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 510,
    definition: withQuantity(
      [SIDES, opt("Material", [v("Composite"), amt("Premium composite", 400)])],
      SMALL_PACK,
    ),
  }),
  seed({
    slug: "loyalty-cards",
    title: "Loyalty Cards",
    category: "ID & Accessories",
    description: "Branded loyalty and membership cards.",
    sku: "PB-LOYALTY",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 520,
    definition: withQuantity([SIDES], SMALL_PACK),
  }),
  seed({
    slug: "business-card-boxes",
    title: "Business Card Boxes",
    category: "ID & Accessories",
    description: "Presentation boxes for finished business cards.",
    sku: "PB-BC-BOXES",
    basePriceMinor: 0,
    uploadsEnabled: false,
    instructionsEnabled: false,
    sort: 530,
    definition: withQuantity([], { "1": 500, "10": 4000, "25": 8500 }),
  }),
  seed({
    slug: "binding",
    title: "Binding",
    category: "ID & Accessories",
    description: "Comb, coil, or staple binding for existing prints.",
    sku: "PB-BINDING",
    basePriceMinor: 0,
    uploadsEnabled: false,
    instructionsEnabled: true,
    sort: 540,
    definition: withQuantity(
      [opt("Type", [v("Comb"), v("Coil"), v("Staple")])],
      { "1": 400, "5": 1500, "10": 2500, "25": 5000 },
    ),
  }),
  seed({
    slug: "lamination",
    title: "Lamination",
    category: "ID & Accessories",
    description: "Gloss or matte lamination for documents and menus.",
    sku: "PB-LAMINATION",
    basePriceMinor: 0,
    uploadsEnabled: false,
    instructionsEnabled: true,
    sort: 550,
    definition: withQuantity(
      [
        opt("Finish", [v("Gloss"), v("Matte")]),
        opt("Size", [v("A4"), v("Letter"), amt("A3", 300)]),
      ],
      { "1": 300, "10": 2200, "25": 4500, "50": 7500 },
    ),
  }),
  seed({
    slug: "mailing-tubes",
    title: "Mailing Tubes",
    category: "ID & Accessories",
    description: "Protective tubes for posters, plans, and prints.",
    sku: "PB-TUBES",
    basePriceMinor: 0,
    uploadsEnabled: false,
    instructionsEnabled: false,
    sort: 560,
    definition: withQuantity(
      [opt("Size", [v("Small"), amt("Medium", 200), amt("Large", 400)])],
      { "1": 600, "10": 4500, "25": 9500 },
    ),
  }),
  seed({
    slug: "lanyards",
    title: "Lanyards",
    category: "ID & Accessories",
    description: "Printed lanyards, single or double sided.",
    sku: "PB-LANYARDS",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 570,
    definition: withQuantity([SIDED], SMALL_PACK),
  }),
  seed({
    slug: "pouches",
    title: "ID Pouches",
    category: "ID & Accessories",
    description: "Clear pouches and badge holders for ID cards.",
    sku: "PB-POUCHES",
    basePriceMinor: 0,
    uploadsEnabled: false,
    instructionsEnabled: false,
    sort: 580,
    definition: withQuantity(
      [opt("Type", [v("Clear pouch"), v("Badge holder")])],
      { "10": 800, "25": 1600, "50": 2800, "100": 4500 },
    ),
  }),
  seed({
    slug: "retractable-clips",
    title: "Retractable Clips",
    category: "ID & Accessories",
    description: "Retractable badge clips for IDs and passes.",
    sku: "PB-CLIPS",
    basePriceMinor: 0,
    uploadsEnabled: false,
    instructionsEnabled: false,
    sort: 590,
    definition: withQuantity(
      [],
      { "10": 900, "25": 1800, "50": 3200, "100": 5500 },
    ),
  }),
];
