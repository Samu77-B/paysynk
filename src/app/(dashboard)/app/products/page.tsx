import { cookies } from "next/headers";
import {
  getDashboardContext,
  getMerchantProducts,
} from "@/lib/dashboard/data";
import { ProductsManager } from "@/components/dashboard/ProductsManager";

export default async function ProductsPage() {
  const cookieStore = await cookies();
  const preferred = cookieStore.get("paysynk_merchant")?.value;
  const ctx = await getDashboardContext(preferred);
  const products = await getMerchantProducts(ctx.merchant.id);

  return (
    <ProductsManager
      merchantId={ctx.merchant.id}
      storeSlug={ctx.merchant.slug}
      initialProducts={products}
      mode={ctx.mode}
    />
  );
}
