import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  DEMO_INVOICES,
  DEMO_MERCHANT,
  DEMO_ORDERS,
  DEMO_PRODUCTS,
} from "@/lib/dashboard/demo-data";
import type { BillingInvoice, Merchant, Order, Product } from "@/types/database";

export type DashboardContext = {
  mode: "supabase" | "demo";
  user: { id: string; email: string; name: string };
  merchants: Merchant[];
  merchant: Merchant;
};

export async function getDashboardContext(
  preferredMerchantId?: string,
): Promise<DashboardContext> {
  if (!isSupabaseConfigured()) {
    return {
      mode: "demo",
      user: {
        id: DEMO_MERCHANT.owner_id,
        email: "merchant@slf.test",
        name: "Acme Merchant",
      },
      merchants: [DEMO_MERCHANT],
      merchant: DEMO_MERCHANT,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  const { data: memberships } = await supabase
    .from("merchant_members")
    .select("merchant_id")
    .eq("user_id", user.id);

  const ids = (memberships ?? []).map((m) => m.merchant_id);
  let merchants: Merchant[] = [];

  if (ids.length) {
    const { data } = await supabase
      .from("merchants")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: true });
    merchants = data ?? [];
  }

  if (!merchants.length) {
    const { data: owned } = await supabase
      .from("merchants")
      .select("*")
      .eq("owner_id", user.id);
    merchants = owned ?? [];
  }

  const merchant =
    merchants.find((m) => m.id === preferredMerchantId) ?? merchants[0];

  if (!merchant) {
    throw new Error("NO_MERCHANT");
  }

  return {
    mode: "supabase",
    user: {
      id: user.id,
      email: user.email ?? "",
      name:
        (user.user_metadata?.full_name as string | undefined) ??
        user.email?.split("@")[0] ??
        "Merchant",
    },
    merchants,
    merchant,
  };
}

export async function getMerchantProducts(merchantId: string): Promise<Product[]> {
  if (!isSupabaseConfigured()) return DEMO_PRODUCTS;

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMerchantOrders(merchantId: string): Promise<Order[]> {
  if (!isSupabaseConfigured()) return DEMO_ORDERS;

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMerchantInvoices(
  merchantId: string,
): Promise<BillingInvoice[]> {
  if (!isSupabaseConfigured()) return DEMO_INVOICES;

  const supabase = await createClient();
  const { data } = await supabase
    .from("billing_invoices")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });
  return data ?? [];
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
  // Placeholder conversion until storefront sessions are tracked
  const conversionRate = orderCount ? Math.min(8.4, 2 + orderCount * 0.35) : 0;

  return {
    revenueToday,
    revenueMonth,
    orderCount,
    aov,
    conversionRate,
  };
}
