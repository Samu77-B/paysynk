import {
  computeOverviewMetrics,
  getDashboardContext,
  getMerchantOrders,
} from "@/lib/dashboard/data";
import { formatGbp } from "@/lib/dashboard/demo-data";
import { CopyEmbedButton } from "@/components/dashboard/CopyEmbedButton";
import { Badge } from "@/components/ui/badge";
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

function statusVariant(status: string) {
  if (status === "fulfilled" || status === "paid") return "default" as const;
  if (status === "unfulfilled" || status === "pending") return "secondary" as const;
  if (status === "refunded") return "destructive" as const;
  return "outline" as const;
}

export default async function OverviewPage() {
  const ctx = await getDashboardContext();
  const orders = await getMerchantOrders(ctx.merchant.id);
  const metrics = computeOverviewMetrics(orders);
  const recent = orders.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-zinc-500">
            {ctx.merchant.name} · live snapshot of revenue and fulfilment
          </p>
        </div>
        <CopyEmbedButton
          merchantId={ctx.merchant.id}
          storeSlug={ctx.merchant.slug}
        />
      </div>

      {ctx.signupStatus !== "approved" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {ctx.signupStatus === "rejected"
            ? "This store was not approved. Contact PaySynk support."
            : "Your shop is pending approval. You can add products here; the public storefront stays hidden until SmartSynk approves it."}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Revenue today"
          value={formatGbp(metrics.revenueToday)}
          hint="Paid / fulfilled orders since midnight"
        />
        <MetricCard
          title="Revenue this month"
          value={formatGbp(metrics.revenueMonth)}
          hint="Month to date"
        />
        <MetricCard
          title="Orders"
          value={String(metrics.orderCount)}
          hint={`AOV ${formatGbp(metrics.aov)}`}
        />
        <MetricCard
          title="Conversion rate"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          hint="Estimated until session tracking ships"
        />
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>
            Latest checkouts across online and POS channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    {order.id.slice(0, 12)}
                  </TableCell>
                  <TableCell>{order.customer_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.status)} className="capitalize">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatGbp(order.total_in_pence)}</TableCell>
                  <TableCell className="text-zinc-500">
                    {new Date(order.created_at).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                </TableRow>
              ))}
              {recent.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-zinc-500">
                    No orders yet.
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

function MetricCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight text-zinc-900">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-zinc-500">{hint}</p>
      </CardContent>
    </Card>
  );
}
