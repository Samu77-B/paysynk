import type { Store, Product as PrismaProduct, Variant, Order as PrismaOrder, OrderItem } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { BillingInvoice, Merchant, Order, OrderStatus, Product } from "@/types/database";

export type DashboardContext = {
  user: { id: string; email: string; name: string };
  merchants: Merchant[];
  merchant: Merchant;
  signupStatus: "pending" | "approved" | "rejected";
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
): Product {
  const stock = product.variants.reduce((sum, v) => sum + v.stockQty, 0);
  const first = product.variants[0];
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
  return {
    id: order.id,
    merchant_id: order.storeId,
    customer_email: order.customerEmail,
    customer_name: null,
    status: toDashboardOrderStatus(order.status),
    total_in_pence: order.totalMinor,
    currency: order.currency,
    items_json: order.items.map((item) => ({
      title: item.title,
      qty: item.quantity,
      price: item.unitPriceMinor,
    })),
    shipping_address: null,
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
  };
}

export async function getMerchantProducts(merchantId: string): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: { storeId: merchantId },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => toDashboardProduct(p, merchantId));
}

export async function getMerchantOrders(merchantId: string): Promise<Order[]> {
  const orders = await prisma.order.findMany({
    where: { storeId: merchantId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return orders.map(toDashboardOrder);
}

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
