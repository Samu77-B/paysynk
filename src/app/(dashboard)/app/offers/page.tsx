import {
  getDashboardContext,
  getMerchantOffers,
  getMerchantProducts,
} from "@/lib/dashboard/data";
import { OffersManager } from "@/components/dashboard/OffersManager";

export default async function OffersPage() {
  const ctx = await getDashboardContext();
  const [products, offers] = await Promise.all([
    getMerchantProducts(ctx.merchant.id),
    getMerchantOffers(ctx.merchant.id),
  ]);

  return <OffersManager products={products} initialOffers={offers} />;
}
