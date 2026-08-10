import { cookies } from "next/headers";
import { getDashboardContext } from "@/lib/dashboard/data";
import { PaymentsSettings } from "@/components/dashboard/PaymentsSettings";

export default async function PaymentsPage() {
  const cookieStore = await cookies();
  const preferred = cookieStore.get("paysynk_merchant")?.value;
  const ctx = await getDashboardContext(preferred);

  return (
    <PaymentsSettings
      merchant={ctx.merchant}
      mode={ctx.mode}
    />
  );
}
