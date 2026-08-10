import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/pricing";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string }>;
};

export default async function SuccessPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { order: orderId } = await searchParams;

  const order = orderId
    ? await prisma.order.findFirst({
        where: { id: orderId, store: { slug } },
        include: { items: true, store: true },
      })
    : null;

  return (
    <main className="success-page">
      <BrandLogo variant="white" height={32} />
      <p className="eyebrow accent-text" style={{ marginTop: "1.25rem" }}>
        Checkout
      </p>
      <h1>Thanks — payment received</h1>
      <p className="muted">
        If the webhook is running, stock has been decremented and the order is
        marked paid. Refresh if status still shows pending.
      </p>

      {order ? (
        <div className="success-card">
          <p>
            <strong>Order</strong> {order.id}
          </p>
          <p>
            <strong>Status</strong> {order.status}
          </p>
          <p>
            <strong>Total</strong>{" "}
            {formatMoney(order.totalMinor, order.currency)}
          </p>
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                {item.quantity}× {item.title} ({item.sku})
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted">Order details unavailable.</p>
      )}

      <p>
        <Link href={`/s/${slug}`}>Back to store</Link>
        {" · "}
        <Link href="/admin">Merchant admin</Link>
      </p>
    </main>
  );
}
