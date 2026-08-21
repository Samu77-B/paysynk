import type { Order, OrderItem, Store, MerchantUser } from "@/generated/prisma/client";
import { sendMail } from "@/lib/email/send";
import {
  customerOrderHtml,
  merchantOrderHtml,
  type EmailLine,
  type ShippingBits,
} from "@/lib/email/templates";

export type { ShippingBits };
import { resolveAppOrigin } from "@/lib/app-url";

type PaidOrder = Order & {
  items: OrderItem[];
  store: Store & { users: MerchantUser[] };
};

function optionLine(options: unknown): string | undefined {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return undefined;
  }
  const record = options as Record<string, unknown>;
  const parts = ["colour", "size"]
    .map((key) => record[key])
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  return parts.length ? parts.join(" · ") : undefined;
}

function emailLines(items: OrderItem[]): EmailLine[] {
  return items.map((item) => ({
    title: item.title,
    quantity: item.quantity,
    lineTotalMinor: item.lineTotalMinor,
    options: optionLine(item.optionsSnapshot),
  }));
}

export function ownerNotifyEmail(store: Store & { users: MerchantUser[] }) {
  return store.notifyEmail?.trim() || store.users[0]?.email || null;
}

export async function sendPaidOrderEmails(opts: {
  order: PaidOrder;
  shipping?: ShippingBits | null;
}) {
  const { order } = opts;
  const { store } = order;
  const ref = order.id.slice(-8).toUpperCase();
  const lines = emailLines(order.items);
  const ownerTo = ownerNotifyEmail(store);
  const origin = resolveAppOrigin("https://www.paysynk.com");

  const jobs: Promise<unknown>[] = [];

  if (order.customerEmail) {
    jobs.push(
      sendMail({
        storeName: store.name,
        to: order.customerEmail,
        replyTo: ownerTo,
        subject: `Order confirmation from ${store.name}`,
        html: customerOrderHtml({
          storeName: store.name,
          logoUrl: store.logoUrl,
          vatNumber: store.vatNumber,
          orderRef: ref,
          currency: order.currency,
          lines,
          shippingMinor: order.shippingMinor,
          discountMinor: order.discountMinor,
          discountLabel: order.discountCode,
          totalMinor: order.totalMinor,
          shipping: opts.shipping,
        }),
      }),
    );
  }

  if (ownerTo) {
    jobs.push(
      sendMail({
        storeName: store.name,
        to: ownerTo,
        subject: `New order ${ref} · ${store.name}`,
        html: merchantOrderHtml({
          storeName: store.name,
          logoUrl: store.logoUrl,
          orderRef: ref,
          currency: order.currency,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          lines,
          shippingMinor: order.shippingMinor,
          totalMinor: order.totalMinor,
          shipping: opts.shipping,
          dashboardUrl: `${origin}/app/orders`,
        }),
      }),
    );
  }

  await Promise.allSettled(jobs);
}
