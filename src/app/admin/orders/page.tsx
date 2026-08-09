import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/pricing";

export default async function AdminOrdersPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/admin/login");

  const orders = await prisma.order.findMany({
    where: { storeId: session.user.storeId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="admin-page">
      <h1>Orders</h1>
      <p className="muted">
        Online checkouts today; channel enum includes <code>pos</code> for later.
      </p>

      {orders.length === 0 ? (
        <p className="muted">No orders yet.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <article key={order.id} className="order-row">
              <header>
                <div>
                  <strong>{order.status}</strong> · {order.channel} ·{" "}
                  {order.paymentProvider}
                </div>
                <div>
                  {formatMoney(order.totalMinor, order.currency)}
                </div>
              </header>
              <p className="muted small">
                {order.createdAt.toISOString()} · {order.id}
                {order.providerPaymentId
                  ? ` · ${order.providerPaymentId}`
                  : ""}
                {order.customerEmail ? ` · ${order.customerEmail}` : ""}
              </p>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.title} ({item.sku}) —{" "}
                    {formatMoney(item.lineTotalMinor, order.currency)}
                  </li>
                ))}
              </ul>
              <p className="muted small">
                Subtotal {formatMoney(order.subtotalMinor, order.currency)} +
                shipping {formatMoney(order.shippingMinor, order.currency)}
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
