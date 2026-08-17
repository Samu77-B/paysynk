"use client";

import { useMemo, useState, useTransition } from "react";
import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatGbp } from "@/lib/dashboard/demo-data";
import { markOrderFulfilled } from "@/lib/dashboard/actions";
import type { Order, OrderStatus } from "@/types/database";

type Filter = "all" | "unfulfilled" | "fulfilled" | "refunded";

export function OrdersManager({
  initialOrders,
  paymentsActive,
}: {
  merchantId: string;
  initialOrders: Order[];
  paymentsActive: boolean;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  function markFulfilled(order: Order) {
    startTransition(async () => {
      const nextStatus: OrderStatus = "fulfilled";
      const result = await markOrderFulfilled(order.id);
      if (result.error) return;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: nextStatus } : o,
        ),
      );
      setSelected((cur) =>
        cur?.id === order.id ? { ...cur, status: nextStatus } : cur,
      );
    });
  }

  function printSlip(order: Order) {
    const items = Array.isArray(order.items_json) ? order.items_json : [];
    const w = window.open("", "_blank", "width=480,height=640");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Packing slip ${order.id}</title>
      <style>body{font-family:system-ui;padding:24px} h1{font-size:18px}</style></head><body>
      <h1>PaySynk packing slip</h1>
      <p><strong>Order</strong> ${order.id}</p>
      <p><strong>Customer</strong> ${order.customer_name ?? ""} · ${order.customer_email ?? ""}</p>
      <ul>${items
        .map((item) => {
          const row = item as { title?: string; qty?: number };
          return `<li>${row.qty ?? 1}× ${row.title ?? "Item"}</li>`;
        })
        .join("")}</ul>
      <p><strong>Total</strong> ${formatGbp(order.total_in_pence)}</p>
      <script>window.print()</script></body></html>`);
    w.document.close();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-zinc-500">
          Fulfilment engine · payment status via Stripe Connect
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unfulfilled">Unfulfilled</TabsTrigger>
          <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
          <TabsTrigger value="refunded">Refunded</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Order queue</CardTitle>
          <CardDescription>
            {filtered.length} shown · click a row for details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(order)}
                >
                  <TableCell className="font-mono text-xs">
                    {order.id.slice(0, 12)}
                  </TableCell>
                  <TableCell>{order.customer_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className="capitalize">{order.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.stripe_payment_id ? "default" : "secondary"}>
                      {order.stripe_payment_id
                        ? paymentsActive
                          ? "Stripe connected"
                          : "Stripe captured"
                        : "Unpaid"}
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Order {selected.id.slice(0, 12)}</SheetTitle>
                <SheetDescription className="capitalize">
                  Status: {selected.status}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-4 text-sm">
                <div>
                  <p className="font-medium">Customer</p>
                  <p>{selected.customer_name}</p>
                  <p className="text-zinc-500">{selected.customer_email}</p>
                </div>
                <div>
                  <p className="font-medium">Items</p>
                  <ul className="mt-1 space-y-1 text-zinc-600">
                    {(Array.isArray(selected.items_json)
                      ? selected.items_json
                      : []
                    ).map((item, idx) => {
                      const row = item as {
                        title?: string;
                        qty?: number;
                        price?: number;
                      };
                      return (
                        <li key={idx}>
                          {row.qty ?? 1}× {row.title ?? "Item"}
                          {typeof row.price === "number"
                            ? ` — ${formatGbp(row.price)}`
                            : ""}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Shipping</p>
                  {selected.shipping_address &&
                  typeof selected.shipping_address === "object" ? (
                    <p className="text-zinc-600">
                      {(selected.shipping_address as { line1?: string }).line1}
                      <br />
                      {(selected.shipping_address as { city?: string }).city}{" "}
                      {
                        (selected.shipping_address as { postcode?: string })
                          .postcode
                      }
                    </p>
                  ) : (
                    <p className="text-zinc-500">No address on file</p>
                  )}
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-medium">Payment</p>
                  <p className="text-zinc-600">
                    {selected.stripe_payment_id
                      ? `Stripe · ${selected.stripe_payment_id}`
                      : "Awaiting payment"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {paymentsActive
                      ? "Payments Active — funds flow directly to your bank account."
                      : "Connect Stripe in Settings → Payments to enable direct payouts."}
                  </p>
                </div>
                <p className="text-lg font-semibold">
                  Total {formatGbp(selected.total_in_pence)}
                </p>
              </div>
              <SheetFooter>
                <Button variant="outline" onClick={() => printSlip(selected)}>
                  <Printer className="size-4" />
                  Print packing slip
                </Button>
                <Button
                  disabled={pending || selected.status === "fulfilled"}
                  onClick={() => markFulfilled(selected)}
                  className="bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
                >
                  Mark as fulfilled
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
