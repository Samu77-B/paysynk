import { cookies } from "next/headers";
import { getDashboardContext } from "@/lib/dashboard/data";
import { IntegrationHub } from "@/components/dashboard/IntegrationHub";

export default async function IntegrationPage() {
  const cookieStore = await cookies();
  const preferred = cookieStore.get("paysynk_merchant")?.value;
  const ctx = await getDashboardContext(preferred);

  return (
    <IntegrationHub
      merchantId={ctx.merchant.id}
      merchantName={ctx.merchant.name}
      storeSlug={ctx.merchant.slug}
    />
  );
}
