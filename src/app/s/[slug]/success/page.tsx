import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { StoreBrand } from "@/components/storefront/StoreBrand";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/pricing";
import { findStoreByPublicSlug } from "@/lib/store-lookup";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string }>;
};

function optionLine(options: unknown): string {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return "";
  }
  const record = options as Record<string, unknown>;
  return ["colour", "size"]
    .map((key) => record[key])
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" · ");
}

export default async function SuccessPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { order: orderId } = await searchParams;

  const store = await findStoreByPublicSlug(slug);
  const order = orderId
    ? await prisma.order.findFirst({
        where: { id: orderId, storeId: store?.id },
        include: { items: true },
      })
    : null;

  const storeName = store?.name ?? "Your order";
  const paid = order?.status === "paid" || order?.status === "fulfilled";

  return (
    <main className="success-page">
      <StoreBrand
        name={storeName}
        logoUrl={store?.logoUrl}
        compact
      />
      <p className="eyebrow accent-text" style={{ marginTop: "1.5rem" }}>
        Order confirmed
      </p>
      <h1>Thanks for your order</h1>
      <p className="muted">
        {paid
          ? "Payment received. A receipt is sent by Stripe to the email you entered at checkout."
          : "Stripe has taken the payment. Your receipt is sent to the email you entered at checkout."}
      </p>

      {order ? (
        <div className="success-card">
          <p className="success-ref">
            <strong>Order</strong> {order.id.slice(-8).toUpperCase()}
          </p>
          <ul className="success-lines">
            {order.items.map((item) => {
              const options = optionLine(item.optionsSnapshot);
              return (
                <li key={item.id}>
                  <div>
                    <strong>
                      {item.quantity}× {item.title}
                    </strong>
                    {options ? (
                      <div className="muted small">{options}</div>
                    ) : null}
                  </div>
                  <span>
                    {formatMoney(item.lineTotalMinor, order.currency)}
                  </span>
                </li>
              );
            })}
            {order.discountMinor > 0 ? (
              <li>
                <span>{order.discountCode || "Discount"}</span>
                <span>
                  −{formatMoney(order.discountMinor, order.currency)}
                </span>
              </li>
            ) : null}
            <li>
              <span>UK shipping</span>
              <span>{formatMoney(order.shippingMinor, order.currency)}</span>
            </li>
          </ul>
          <p className="success-total">
            <strong>Total</strong>
            <strong>{formatMoney(order.totalMinor, order.currency)}</strong>
          </p>
        </div>
      ) : (
        <p className="muted">Order details unavailable.</p>
      )}

      <p>
        <Link href={`/s/${slug}`}>Back to store</Link>
      </p>

      <p className="success-powered">
        <span>Powered by</span>
        <Link href="/" aria-label="PaySynk">
          <BrandLogo variant="white" height={22} />
        </Link>
      </p>
    </main>
  );
}
