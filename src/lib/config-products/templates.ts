import type { TemplateDefinition } from "@/lib/config-products/types";

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

const MENU_STUBS: Array<{ slug: string; title: string; category: string; sort: number }> = [
  { slug: "scanning", title: "Scanning", category: "Business Products", sort: 20 },
  { slug: "booklets", title: "Booklets", category: "Business Products", sort: 40 },
  { slug: "labels", title: "Labels", category: "Business Products", sort: 50 },
  { slug: "reports", title: "Reports", category: "Business Products", sort: 60 },
  { slug: "manuals", title: "Manuals", category: "Business Products", sort: 70 },
  { slug: "menus", title: "Menus", category: "Business Products", sort: 80 },
  { slug: "press-kits", title: "Press Kits", category: "Business Products", sort: 90 },
  { slug: "letterheads", title: "Letterheads", category: "Business Products", sort: 100 },
  { slug: "envelopes", title: "Envelopes", category: "Business Products", sort: 110 },
  { slug: "architectural-drawings", title: "Architectural Drawings", category: "Business Products", sort: 120 },
  { slug: "receipt-books", title: "Receipt Books", category: "Business Products", sort: 130 },
  { slug: "comp-slips", title: "Comp Slips", category: "Business Products", sort: 140 },
  { slug: "brochures", title: "Brochures", category: "Marketing Material", sort: 200 },
  { slug: "calendars", title: "Calendars", category: "Marketing Material", sort: 210 },
  { slug: "catalogues", title: "Catalogues", category: "Marketing Material", sort: 220 },
  { slug: "flyers", title: "Flyers", category: "Marketing Material", sort: 230 },
  { slug: "magazines", title: "Magazines", category: "Marketing Material", sort: 240 },
  { slug: "newsletters", title: "Newsletters", category: "Marketing Material", sort: 250 },
  { slug: "standees", title: "Standees", category: "Marketing Material", sort: 260 },
  { slug: "easel-backs", title: "Easel Backs", category: "Marketing Material", sort: 270 },
  { slug: "tent-cards", title: "Tent Cards", category: "Marketing Material", sort: 280 },
  { slug: "certificates", title: "Certificates", category: "Events & More", sort: 300 },
  { slug: "event-tickets", title: "Event Tickets", category: "Events & More", sort: 310 },
  { slug: "invitations", title: "Invitations", category: "Events & More", sort: 320 },
  { slug: "gift-certificates", title: "Gift Certificates", category: "Events & More", sort: 330 },
  { slug: "greeting-cards", title: "Greeting Cards", category: "Events & More", sort: 340 },
  { slug: "wristbands", title: "Wristbands", category: "Events & More", sort: 350 },
  { slug: "programs", title: "Programs", category: "Events & More", sort: 360 },
  { slug: "sporting-bibs", title: "Sporting Bibs", category: "Events & More", sort: 370 },
  { slug: "retractable-banners", title: "Retractable Banners", category: "Signs & Printing", sort: 400 },
  { slug: "hanging-banners", title: "Hanging Banners", category: "Signs & Printing", sort: 410 },
  { slug: "x-banner-stand", title: "X Banner Stand", category: "Signs & Printing", sort: 420 },
  { slug: "outdoor-banners", title: "Outdoor Banners", category: "Signs & Printing", sort: 430 },
  { slug: "photo-prints", title: "Photo Prints", category: "Signs & Printing", sort: 440 },
  { slug: "posters", title: "Posters", category: "Signs & Printing", sort: 450 },
  { slug: "canvas-printing", title: "Canvas Printing", category: "Signs & Printing", sort: 460 },
  { slug: "pvc-id-cards", title: "PVC ID Cards", category: "ID & Accessories", sort: 500 },
  { slug: "composite-id-cards", title: "Composite ID Cards", category: "ID & Accessories", sort: 510 },
  { slug: "loyalty-cards", title: "Loyalty Cards", category: "ID & Accessories", sort: 520 },
  { slug: "business-card-boxes", title: "Business Card Boxes", category: "ID & Accessories", sort: 530 },
  { slug: "binding", title: "Binding", category: "ID & Accessories", sort: 540 },
  { slug: "lamination", title: "Lamination", category: "ID & Accessories", sort: 550 },
  { slug: "mailing-tubes", title: "Mailing Tubes", category: "ID & Accessories", sort: 560 },
  { slug: "lanyards", title: "Lanyards", category: "ID & Accessories", sort: 570 },
  { slug: "pouches", title: "Pouches", category: "ID & Accessories", sort: 580 },
  { slug: "retractable-clips", title: "Retractable Clips", category: "ID & Accessories", sort: 590 },
];

function genericPrintDef(): TemplateDefinition {
  return {
    options: [
      {
        name: "Size",
        values: [{ label: "Letter 8.5 × 11" }, { label: "A4" }, { label: "A5" }],
      },
      {
        name: "Quantity",
        values: [
          { label: "25" },
          { label: "50" },
          { label: "100" },
          { label: "250" },
        ],
      },
    ],
    variations: [
      { matchLabels: { Quantity: "25" }, priceMinor: 1500 },
      { matchLabels: { Quantity: "50" }, priceMinor: 2500 },
      { matchLabels: { Quantity: "100" }, priceMinor: 4000 },
      { matchLabels: { Quantity: "250" }, priceMinor: 7500 },
    ],
  };
}

function brochureDef(): TemplateDefinition {
  return {
    options: [
      {
        name: "Size",
        values: [
          { label: "A4" },
          { label: "A5" },
          { label: "DL" },
          { label: "Letter 8.5 × 11" },
        ],
      },
      {
        name: "Fold",
        values: [
          { label: "No fold" },
          { label: "Bi-fold" },
          { label: "Tri-fold", modifierKind: "amount", modifierValue: 200 },
        ],
      },
      {
        name: "Printed sides",
        values: [
          { label: "Single" },
          { label: "Double", modifierKind: "amount", modifierValue: 400 },
        ],
      },
      {
        name: "Paper",
        values: [
          { label: "130gsm Silk" },
          { label: "170gsm Silk", modifierKind: "amount", modifierValue: 300 },
          { label: "250gsm Silk", modifierKind: "amount", modifierValue: 600 },
        ],
      },
      {
        name: "Quantity",
        values: [
          { label: "25" },
          { label: "50" },
          { label: "100" },
          { label: "250" },
          { label: "500" },
        ],
      },
    ],
    variations: [
      { matchLabels: { Quantity: "25" }, priceMinor: 2500 },
      { matchLabels: { Quantity: "50" }, priceMinor: 4000 },
      { matchLabels: { Quantity: "100" }, priceMinor: 6500 },
      { matchLabels: { Quantity: "250" }, priceMinor: 12000 },
      { matchLabels: { Quantity: "500" }, priceMinor: 20000 },
    ],
  };
}

export const PRINT_TEMPLATES: PrintTemplateSeed[] = [
  {
    slug: "colour-bw-printing",
    title: "Colour/Black & White Printing",
    category: "Business Products",
    description:
      "Print on Letter, Legal, and Tabloid. Binding and stapling on request. Rush service available.",
    sku: "00004",
    basePriceMinor: 310,
    uploadsEnabled: true,
    instructionsEnabled: false,
    sort: 10,
    definition: {
      options: [
        {
          name: "Quantity of Pages",
          values: [
            { label: "BW 10" },
            { label: "BW 50", modifierKind: "amount", modifierValue: 1500 },
            { label: "Colour 10", modifierKind: "amount", modifierValue: 2000 },
            { label: "Colour 50", modifierKind: "amount", modifierValue: 8000 },
          ],
        },
        {
          name: "Paper Size",
          values: [
            { label: "Letter 8.5 × 11" },
            { label: "Legal 8.5 × 14", modifierKind: "amount", modifierValue: 50 },
            { label: "Tabloid 11 × 17", modifierKind: "amount", modifierValue: 150 },
          ],
        },
        {
          name: "Printed Sides",
          values: [
            { label: "Single" },
            { label: "Double", modifierKind: "amount", modifierValue: 100 },
          ],
        },
        {
          name: "Paper Orientation",
          values: [{ label: "Portrait" }, { label: "Landscape" }],
        },
        {
          name: "Rush Charge +15%",
          required: false,
          values: [
            { label: "Standard" },
            {
              label: "Rush +15%",
              modifierKind: "percent",
              modifierValue: 15,
            },
          ],
        },
      ],
    },
  },
  {
    slug: "business-cards",
    title: "Business Cards",
    category: "Business Products",
    description:
      "Professional cards on a range of materials. Upload your artwork or add a note for in-house design.",
    sku: "00000",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: 30,
    definition: {
      options: [
        {
          name: "Printed sides",
          values: [
            { label: "Single" },
            { label: "Double", modifierKind: "amount", modifierValue: 800 },
          ],
        },
        {
          name: "Material",
          values: [
            { label: "350gsm Silk" },
            { label: "400gsm Uncoated", modifierKind: "amount", modifierValue: 400 },
            { label: "Recycled", modifierKind: "amount", modifierValue: 200 },
          ],
        },
        {
          name: "Size",
          values: [{ label: "85 × 55mm" }, { label: "90 × 50mm" }],
        },
        {
          name: "Quantity",
          values: [
            { label: "100" },
            { label: "250" },
            { label: "500" },
            { label: "1000" },
          ],
        },
        {
          name: "Add boxes?",
          required: false,
          values: [
            { label: "None" },
            { label: "Add boxes", modifierKind: "amount", modifierValue: 500 },
          ],
        },
      ],
      variations: [
        { matchLabels: { Quantity: "100" }, priceMinor: 2500, sku: "BC-100" },
        { matchLabels: { Quantity: "250" }, priceMinor: 4500, sku: "BC-250" },
        { matchLabels: { Quantity: "500" }, priceMinor: 7500, sku: "BC-500" },
        { matchLabels: { Quantity: "1000" }, priceMinor: 12000, sku: "BC-1000" },
      ],
    },
  },
  ...MENU_STUBS.map((row) => ({
    slug: row.slug,
    title: row.title,
    category: row.category,
    description: `Configure ${row.title.toLowerCase()} with size, quantity, and file upload. Edit options and prices in your dashboard.`,
    sku: "",
    basePriceMinor: 0,
    uploadsEnabled: true,
    instructionsEnabled: true,
    sort: row.sort,
    definition: row.slug === "brochures" ? brochureDef() : genericPrintDef(),
  })),
];
