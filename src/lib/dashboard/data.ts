import type { Store, Product as PrismaProduct, Variant, Order as PrismaOrder, OrderItem, Offer } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toPublicOffer, type PublicOffer } from "@/lib/offers";
import { shippingBitsFromJson } from "@/lib/checkout-customer";
import type { BillingInvoice, Merchant, Order, OrderStatus, Product } from "@/types/database";

export type CatalogVariant = {
  id: string;
  sku: string;
  colour?: string;
  size?: string;
  stockQty: number;
  priceMinor: number;
  imageUrl: string | null;
};

export type CatalogProduct = Product & {
  variants: CatalogVariant[];
};

export type DashboardContext = {
  user: { id: string; email: string; name: string };
  merchants: Merchant[];
  merchant: Merchant;
  signupStatus: "pending" | "approved" | "rejected";
  currency: string;
  shippingFlatMinor: number;
  shippingIntlMinor: number | null;
  homeCountry: string;
  logoUrl: string | null;
  vatNumber: string | null;
  notifyEmail: string | null;
  salesReportFrequency: Store["salesReportFrequency"];
  embedTheme: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function toMerchant(store: Store, ownerId: string): Merchant {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    owner_id: ownerId,
    plan_tier: "standard",
    stripe_connect_id: store.stripeConnectId,
    paypal_merchant_id: store.paypalMerchantId,
    payments_active: store.paymentsActive,
    billing_customer_id: null,
    current_period_end: null,
    created_at: store.createdAt.toISOString(),
  };
}

export function toDashboardProduct(
  product: PrismaProduct & { variants: Variant[] },
  merchantId: string,
): CatalogProduct {
  const stock = product.variants.reduce((sum, v) => sum + v.stockQty, 0);
  const first = product.variants[0];
  const variants: CatalogVariant[] = product.variants.map((v) => {
    const options = (v.options ?? {}) as Record<string, string>;
    return {
      id: v.id,
      sku: v.sku,
      colour: options.colour || undefined,
      size: options.size || undefined,
      stockQty: v.stockQty,
      priceMinor: v.priceMinor,
      imageUrl: v.imageUrl,
    };
  });
  return {
    id: product.id,
    merchant_id: merchantId,
    title: product.title,
    slug: slugify(product.title) || product.id,
    description: product.description,
    price_in_pence: first?.priceMinor ?? 0,
    compare_at_price_in_pence: null,
    sku: first?.sku ?? null,
    stock_quantity: stock,
    images: product.images,
    tags: [],
    category: null,
    is_active: product.active,
    created_at: product.createdAt.toISOString(),
    variants,
  };
}

function toDashboardOrderStatus(status: PrismaOrder["status"]): OrderStatus {
  if (status === "paid") return "unfulfilled";
  if (status === "fulfilled") return "fulfilled";
  if (status === "refunded") return "refunded";
  if (status === "cancelled") return "cancelled";
  return "pending";
}

export function toDashboardOrder(
  order: PrismaOrder & { items: OrderItem[] },
): Order {
  const ship = shippingBitsFromJson(order.shippingAddress);
  return {
    id: order.id,
    merchant_id: order.storeId,
    customer_email: order.customerEmail,
    customer_name: order.customerName,
    status: toDashboardOrderStatus(order.status),
    total_in_pence: order.totalMinor,
    currency: order.currency,
    items_json: order.items.map((item) => {
      const snap = (item.optionsSnapshot ?? {}) as Record<string, unknown>;
      const detail =
        typeof snap.optionsLabel === "string"
          ? snap.optionsLabel
          : [snap.colour, snap.size].filter(Boolean).join(" · ");
      const filesRaw = snap.files;
      const files = Array.isArray(filesRaw)
        ? filesRaw.length
        : typeof filesRaw === "string" && filesRaw
          ? filesRaw.split("\n").filter(Boolean).length
          : 0;
      const extra = files ? ` · ${files} file${files === 1 ? "" : "s"}` : "";
      return {
        title: detail ? `${item.title} — ${detail}${extra}` : item.title,
        qty: item.quantity,
        price: item.unitPriceMinor,
      };
    }),
    shipping_address: ship
      ? {
          name: ship.name ?? null,
          phone: order.customerPhone ?? ship.phone ?? null,
          line1: ship.line1 ?? null,
          line2: ship.line2 ?? null,
          city: ship.city ?? null,
          postcode: ship.postalCode ?? null,
          country: ship.country ?? "GB",
        }
      : null,
    stripe_payment_id: order.providerPaymentId,
    channel: order.channel,
    created_at: order.createdAt.toISOString(),
  };
}

export async function getDashboardContext(): Promise<DashboardContext> {
  const session = await auth();
  if (!session?.user?.storeId) {
    throw new Error("UNAUTHENTICATED");
  }

  const store = await prisma.store.findUnique({
    where: { id: session.user.storeId },
  });
  if (!store) {
    throw new Error("NO_MERCHANT");
  }

  const merchant = toMerchant(store, session.user.id);
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.name ?? store.name,
    },
    merchants: [merchant],
    merchant,
    signupStatus: store.signupStatus,
    currency: store.currency,
    shippingFlatMinor: store.shippingFlatMinor,
    shippingIntlMinor: store.shippingIntlMinor,
    homeCountry: store.homeCountry,
    logoUrl: store.logoUrl,
    vatNumber: store.vatNumber,
    notifyEmail: store.notifyEmail,
    salesReportFrequency: store.salesReportFrequency,
    embedTheme: store.embedTheme,
  };
}

export async function getMerchantProducts(
  merchantId: string,
): Promise<CatalogProduct[]> {
  const products = await prisma.product.findMany({
    where: { storeId: merchantId },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => toDashboardProduct(p, merchantId));
}

export type DashboardOffer = PublicOffer & {
  active: boolean;
  createdAt: string;
};

export async function getMerchantOffers(
  merchantId: string,
): Promise<DashboardOffer[]> {
  const rows = await prisma.offer.findMany({
    where: { storeId: merchantId },
    orderBy: { createdAt: "desc" },
  });
  const giftIds = rows
    .map((row) => row.giftProductId)
    .filter((id): id is string => Boolean(id));
  const giftProducts =
    giftIds.length === 0
      ? []
      : await prisma.product.findMany({
          where: { id: { in: giftIds }, storeId: merchantId },
          select: { id: true, title: true },
        });
  const giftTitleById = new Map(giftProducts.map((p) => [p.id, p.title]));
  return rows.map((row: Offer) => ({
    ...toPublicOffer(
      row,
      row.giftProductId ? giftTitleById.get(row.giftProductId) ?? null : null,
    ),
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getMerchantOrders(merchantId: string): Promise<Order[]> {
  const orders = await prisma.order.findMany({
    where: { storeId: merchantId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return orders.map(toDashboardOrder);
}

export { getMerchantConfigProducts, getConfigTemplates } from "@/lib/dashboard/config-data";

export async function getMerchantInvoices(
  _merchantId: string,
): Promise<BillingInvoice[]> {
  return [];
}

export function computeOverviewMetrics(orders: Order[]) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const paidLike = (o: Order) =>
    ["paid", "unfulfilled", "fulfilled"].includes(o.status);

  const today = orders.filter(
    (o) => paidLike(o) && new Date(o.created_at) >= startOfDay,
  );
  const month = orders.filter(
    (o) => paidLike(o) && new Date(o.created_at) >= startOfMonth,
  );

  const revenueToday = today.reduce((s, o) => s + o.total_in_pence, 0);
  const revenueMonth = month.reduce((s, o) => s + o.total_in_pence, 0);
  const orderCount = month.length;
  const aov = orderCount ? Math.round(revenueMonth / orderCount) : 0;
  const conversionRate = orderCount ? Math.min(8.4, 2 + orderCount * 0.35) : 0;

  return {
    revenueToday,
    revenueMonth,
    orderCount,
    aov,
    conversionRate,
  };
}
