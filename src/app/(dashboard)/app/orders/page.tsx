import {
  getDashboardContext,
  getMerchantOrders,
} from "@/lib/dashboard/data";
import { OrdersManager } from "@/components/dashboard/OrdersManager";

export default async function OrdersPage() {
  const ctx = await getDashboardContext();
  const orders = await getMerchantOrders(ctx.merchant.id);

  return (
    <OrdersManager
      merchantId={ctx.merchant.id}
      initialOrders={orders}
      paymentsActive={ctx.merchant.payments_active}
    />
  );
}
