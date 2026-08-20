import { getDashboardContext } from "@/lib/dashboard/data";
import { PaymentsSettings } from "@/components/dashboard/PaymentsSettings";
import { stripeConnectConfigured } from "@/lib/payments/stripe-connect";
import { paypalConnectConfigured } from "@/lib/payments/paypal";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const ctx = await getDashboardContext();
  const flash = await searchParams;

  return (
    <PaymentsSettings
      merchant={ctx.merchant}
      stripeConnectReady={stripeConnectConfigured()}
      paypalConnectReady={paypalConnectConfigured()}
      flash={flash}
    />
  );
}
