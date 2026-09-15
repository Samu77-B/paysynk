import {
  getDashboardContext,
  getMerchantLoyaltyMembers,
} from "@/lib/dashboard/data";
import { PointsManager } from "@/components/dashboard/PointsManager";

export default async function PointsPage() {
  const ctx = await getDashboardContext();
  const members = await getMerchantLoyaltyMembers(ctx.merchant.id);

  return (
    <PointsManager
      initialMembers={members}
      productPts={ctx.loyaltyProductPtsPerPound}
      servicePts={ctx.loyaltyServicePtsPerPound}
    />
  );
}
