import Link from "next/link";
import { cookies } from "next/headers";
import {
  getDashboardContext,
  getMerchantInvoices,
} from "@/lib/dashboard/data";
import { formatGbp, PLAN_META } from "@/lib/dashboard/demo-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function BillingPage() {
  const cookieStore = await cookies();
  const preferred = cookieStore.get("paysynk_merchant")?.value;
  const ctx = await getDashboardContext(preferred);
  const invoices = await getMerchantInvoices(ctx.merchant.id);
  const plan = PLAN_META[ctx.merchant.plan_tier];
  const nextBill = ctx.merchant.current_period_end
    ? new Date(ctx.merchant.current_period_end).toLocaleDateString("en-GB", {
        dateStyle: "long",
      })
    : "—";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/settings" className="text-sm text-zinc-500 hover:underline">
          ← Settings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-zinc-500">
          Manage your PaySynk subscription (£19 Standard / £39 Retail & POS)
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardDescription>Current plan</CardDescription>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold tracking-tight">
              £{plan.price}
              <span className="text-base font-normal text-zinc-500"> / month</span>
            </p>
            <p className="text-sm text-zinc-500">{plan.blurb}</p>
            <p className="text-sm">
              Next billing date: <strong>{nextBill}</strong>
            </p>
            <Badge variant="secondary" className="capitalize">
              {ctx.merchant.plan_tier.replace("_", " ")}
            </Badge>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                asChild
                className="bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
              >
                <a href="https://billing.stripe.com" target="_blank" rel="noreferrer">
                  Open Stripe billing portal
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href="https://manage.gocardless.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  GoCardless portal
                </a>
              </Button>
            </div>
            <p className="text-xs text-zinc-500">
              Swap these links for your Stripe Customer Portal / GoCardless
              redirect once billing products are created.
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#9FE870]/40 bg-[#141414] text-zinc-100 shadow-sm">
          <CardHeader>
            <CardDescription className="text-zinc-400">Upgrade</CardDescription>
            <CardTitle className="text-white">Retail & POS — £39/mo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>Everything in Standard, plus:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>POS / till on iPad & Android</li>
              <li>Real-time inventory sync</li>
              <li>Unlimited products & staff</li>
              <li>Multi-location reporting</li>
            </ul>
            <Button className="mt-3 bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]">
              Upgrade plan
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Invoice history</CardTitle>
          <CardDescription>Past PaySynk subscription charges</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    {new Date(inv.created_at).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell>{formatGbp(inv.amount_in_pence)}</TableCell>
                  <TableCell>
                    <Badge className="capitalize">{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-500">
                    {inv.period_start
                      ? new Date(inv.period_start).toLocaleDateString("en-GB")
                      : "—"}{" "}
                    →{" "}
                    {inv.period_end
                      ? new Date(inv.period_end).toLocaleDateString("en-GB")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-zinc-500">
                    No invoices yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
