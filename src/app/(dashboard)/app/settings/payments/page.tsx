import { getDashboardContext } from "@/lib/dashboard/data";
import { PaymentsSettings } from "@/components/dashboard/PaymentsSettings";

export default async function PaymentsPage() {
  const ctx = await getDashboardContext();

  return <PaymentsSettings merchant={ctx.merchant} />;
}
