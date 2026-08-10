import { cookies } from "next/headers";
import {
  getDashboardContext,
  getMerchantOrders,
} from "@/lib/dashboard/data";
import { OrdersManager } from "@/components/dashboard/OrdersManager";

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const preferred = cookieStore.get("paysynk_merchant")?.value;
  const ctx = await getDashboardContext(preferred);
  const orders = await getMerchantOrders(ctx.merchant.id);

  return (
    <OrdersManager
      merchantId={ctx.merchant.id}
      initialOrders={orders}
      paymentsActive={ctx.merchant.payments_active}
      mode={ctx.mode}
    />
  );
}
