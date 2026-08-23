import Link from "next/link";
import { CreditCard, Wallet, ChevronRight } from "lucide-react";
import { getDashboardContext } from "@/lib/dashboard/data";
import { PLAN_META } from "@/lib/dashboard/demo-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShippingSettings } from "@/components/dashboard/ShippingSettings";
import { StoreLogoSettings } from "@/components/dashboard/StoreLogoSettings";
import { StoreIdentitySettings } from "@/components/dashboard/StoreIdentitySettings";
import { StoreProfileSettings } from "@/components/dashboard/StoreProfileSettings";
import { EmbedThemeSettings } from "@/components/dashboard/EmbedThemeSettings";

export default async function SettingsPage() {
  const ctx = await getDashboardContext();
  const plan = PLAN_META[ctx.merchant.plan_tier];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500">
          Store profile, VAT, order emails, website card look, delivery charge,
          payments, and subscription
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/app/settings/payments">
          <Card className="h-full border-zinc-200 shadow-sm transition hover:border-[#9FE870]">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="size-4 text-[#1f6b4a]" />
                  Payments
                </CardTitle>
                <CardDescription className="mt-2">
                  Connect Stripe or PayPal so funds land in your account.
                </CardDescription>
              </div>
              <ChevronRight className="size-4 text-zinc-400" />
            </CardHeader>
          </Card>
        </Link>

        <Link href="/app/settings/billing">
          <Card className="h-full border-zinc-200 shadow-sm transition hover:border-[#9FE870]">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-4 text-[#1f6b4a]" />
                  Billing
                </CardTitle>
                <CardDescription className="mt-2">
                  Current plan: {plan.name} (£{plan.price}/mo)
                </CardDescription>
              </div>
              <ChevronRight className="size-4 text-zinc-400" />
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Store</CardTitle>
          <CardDescription>
            Public URL{" "}
            <code className="rounded bg-zinc-100 px-1">/s/{ctx.merchant.slug}</code>
            {" · "}
            merchant id{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">
              {ctx.merchant.id}
            </code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <StoreIdentitySettings
            name={ctx.merchant.name}
            slug={ctx.merchant.slug}
            currency={ctx.currency}
            fxQuoteCurrency={ctx.fxQuoteCurrency}
            exchangeRate={ctx.exchangeRate}
          />
          <StoreLogoSettings logoUrl={ctx.logoUrl} />
          <EmbedThemeSettings embedTheme={ctx.embedTheme} />
          <StoreProfileSettings
            vatNumber={ctx.vatNumber}
            notifyEmail={ctx.notifyEmail}
            ownerEmail={ctx.user.email}
            salesReportFrequency={ctx.salesReportFrequency}
          />
          <ShippingSettings
            currency={ctx.currency}
            shippingFlatMinor={ctx.shippingFlatMinor}
            shippingIntlMinor={ctx.shippingIntlMinor}
            homeCountry={ctx.homeCountry}
          />
        </CardContent>
      </Card>
    </div>
  );
}
