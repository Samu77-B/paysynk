import type { BillingInvoice, Merchant, Order, Product } from "@/types/database";

/** Local demo tenant used when Supabase env is not configured. */
export const DEMO_MERCHANT: Merchant = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Acme Store",
  slug: "slf",
  owner_id: "00000000-0000-0000-0000-000000000001",
  plan_tier: "standard",
  stripe_connect_id: null,
  paypal_merchant_id: null,
  payments_active: false,
  billing_customer_id: null,
  current_period_end: new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 18,
  ).toISOString(),
  created_at: new Date().toISOString(),
};

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "p1",
    merchant_id: DEMO_MERCHANT.id,
    title: "Acme Minimalist Heavyweight Hoodie",
    slug: "acme-minimalist-heavyweight-hoodie",
    description:
      "450gsm organic French terry cotton. Boxy oversized fit with subtle tonal Acme chest embroidery.",
    price_in_pence: 6500,
    compare_at_price_in_pence: null,
    sku: "ACME-HOODIE",
    stock_quantity: 85,
    images: [],
    tags: ["apparel", "hoodie"],
    category: "Apparel",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "p2",
    merchant_id: DEMO_MERCHANT.id,
    title: "Acme Insulated Steel Water Bottle (750ml)",
    slug: "acme-insulated-steel-water-bottle",
    description:
      "Double-wall vacuum insulation keeps drinks cold for 24 hours or hot for 12 hours. BPA-free stainless steel.",
    price_in_pence: 2200,
    compare_at_price_in_pence: null,
    sku: "ACME-BOTTLE",
    stock_quantity: 200,
    images: [],
    tags: ["accessories", "bottle"],
    category: "Accessories",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "p3",
    merchant_id: DEMO_MERCHANT.id,
    title: "Acme Artisan Ceramic Mug Set",
    slug: "acme-artisan-ceramic-mug-set",
    description:
      "Hand-thrown speckled stoneware mugs. Set of 2 with ergonomic thumb rests. Microwave and dishwasher safe.",
    price_in_pence: 3400,
    compare_at_price_in_pence: null,
    sku: "ACME-MUG-SET",
    stock_quantity: 30,
    images: [],
    tags: ["home", "mugs"],
    category: "Home",
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const DEMO_ORDERS: Order[] = [
  {
    id: "ord_8f2a91",
    merchant_id: DEMO_MERCHANT.id,
    customer_email: "alex@example.com",
    customer_name: "Alex Morgan",
    status: "paid",
    total_in_pence: 7025,
    currency: "gbp",
    items_json: [
      { title: "Acme Minimalist Heavyweight Hoodie — Charcoal Black / M", qty: 1, price: 6500 },
    ],
    shipping_address: {
      line1: "12 King Street",
      city: "London",
      postcode: "E1 6AN",
      country: "GB",
    },
    stripe_payment_id: "cs_test_demo",
    channel: "online",
    created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  {
    id: "ord_3c11be",
    merchant_id: DEMO_MERCHANT.id,
    customer_email: "sam@example.com",
    customer_name: "Sam Rivera",
    status: "unfulfilled",
    total_in_pence: 2725,
    currency: "gbp",
    items_json: [
      { title: "Acme Insulated Steel Water Bottle — Matte Black", qty: 1, price: 2200 },
    ],
    shipping_address: {
      line1: "4 Harbour Road",
      city: "Brighton",
      postcode: "BN1 1AA",
      country: "GB",
    },
    stripe_payment_id: "cs_test_demo2",
    channel: "online",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "ord_9aa012",
    merchant_id: DEMO_MERCHANT.id,
    customer_email: "jordan@example.com",
    customer_name: "Jordan Lee",
    status: "fulfilled",
    total_in_pence: 3925,
    currency: "gbp",
    items_json: [{ title: "Acme Artisan Ceramic Mug Set", qty: 1, price: 3400 }],
    shipping_address: {
      line1: "88 High Street",
      city: "Manchester",
      postcode: "M1 1AE",
      country: "GB",
    },
    stripe_payment_id: "cs_test_demo3",
    channel: "online",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
  },
];

export const DEMO_INVOICES: BillingInvoice[] = [
  {
    id: "inv_01",
    merchant_id: DEMO_MERCHANT.id,
    amount_in_pence: 1900,
    currency: "gbp",
    status: "paid",
    invoice_url: null,
    period_start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    period_end: new Date().toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

export function formatGbp(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export const PLAN_META = {
  standard: {
    name: "PaySynk Standard",
    price: 19,
    blurb: "Embeddable cart for small shops and salons",
  },
  retail_pos: {
    name: "PaySynk Retail & POS",
    price: 39,
    blurb: "Web cart + till with live inventory sync",
  },
} as const;
