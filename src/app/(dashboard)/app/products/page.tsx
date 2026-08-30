import { getDashboardContext, getMerchantProducts } from "@/lib/dashboard/data";
import {
  getConfigTemplates,
  getMerchantConfigProducts,
} from "@/lib/dashboard/config-data";
import { ProductsManager } from "@/components/dashboard/ProductsManager";
import { ConfigProductsManager } from "@/components/dashboard/ConfigProductsManager";

export default async function ProductsPage() {
  const ctx = await getDashboardContext();
  const [products, configProducts, templates] = await Promise.all([
    getMerchantProducts(ctx.merchant.id),
    getMerchantConfigProducts(ctx.merchant.id),
    getConfigTemplates(),
  ]);

  return (
    <div className="space-y-10">
      <ProductsManager
        merchantId={ctx.merchant.id}
        storeSlug={ctx.merchant.slug}
        initialProducts={products}
        paymentsActive={ctx.merchant.payments_active}
      />
      <div id="print">
        <ConfigProductsManager
          storeSlug={ctx.merchant.slug}
          currency={ctx.currency}
          initialProducts={configProducts}
          templates={templates}
        />
      </div>
    </div>
  );
}
