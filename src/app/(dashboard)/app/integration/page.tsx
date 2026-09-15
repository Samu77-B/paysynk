import { getDashboardContext, getMerchantProducts } from "@/lib/dashboard/data";
import { IntegrationHub } from "@/components/dashboard/IntegrationHub";

export default async function IntegrationPage() {
  const ctx = await getDashboardContext();
  const products = await getMerchantProducts(ctx.merchant.id);

  return (
    <IntegrationHub
      merchantId={ctx.merchant.id}
      merchantName={ctx.merchant.name}
      storeSlug={ctx.merchant.slug}
      embedTheme={ctx.embedTheme}
      embedAccent={ctx.embedAccent}
      embedAccentText={ctx.embedAccentText}
      embedFont={ctx.embedFont}
      embedRadius={ctx.embedRadius}
      productSlugs={products.filter((p) => p.is_active).map((p) => p.slug)}
    />
  );
}
