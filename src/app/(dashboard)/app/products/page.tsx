import {
  getDashboardContext,
  getMerchantProducts,
} from "@/lib/dashboard/data";
import { ProductsManager } from "@/components/dashboard/ProductsManager";

export default async function ProductsPage() {
  const ctx = await getDashboardContext();
  const products = await getMerchantProducts(ctx.merchant.id);

  return (
    <ProductsManager
      merchantId={ctx.merchant.id}
      storeSlug={ctx.merchant.slug}
      initialProducts={products}
      paymentsActive={ctx.merchant.payments_active}
    />
  );
}
