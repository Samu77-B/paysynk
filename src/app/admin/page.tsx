import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/pricing";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/admin/login");

  const storeId = session.user.storeId;
  const [productCount, variantAgg, orderCount, recentOrders, store] =
    await Promise.all([
      prisma.product.count({ where: { storeId } }),
      prisma.variant.aggregate({
        where: { product: { storeId } },
        _sum: { stockQty: true },
      }),
      prisma.order.count({ where: { storeId } }),
      prisma.order.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.store.findUniqueOrThrow({ where: { id: storeId } }),
    ]);

  return (
    <main className="admin-page">
      <h1>{store.name}</h1>
      <p className="muted">Merchant dashboard — stock, orders, settings.</p>

      <div className="admin-stats">
        <div>
          <strong>{productCount}</strong>
          <span>Products</span>
        </div>
        <div>
          <strong>{variantAgg._sum.stockQty ?? 0}</strong>
          <span>Units in stock</span>
        </div>
        <div>
          <strong>{orderCount}</strong>
          <span>Orders</span>
        </div>
      </div>

      <section>
        <div className="section-head">
          <h2>Recent orders</h2>
          <Link href="/admin/orders">View all</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="muted">No orders yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Status</th>
                <th>Channel</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td>{o.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                  <td>{o.status}</td>
                  <td>{o.channel}</td>
                  <td>{formatMoney(o.totalMinor, o.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
