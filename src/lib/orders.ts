import { prisma } from "@/lib/prisma";

/**
 * Mark order paid and decrement stock. Idempotent: if already paid, no-op.
 * Re-checks stock inside a transaction to reduce oversell risk.
 */
export async function markOrderPaidIdempotent(opts: {
  orderId: string;
  providerPaymentId: string;
  customerEmail?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: opts.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error(`Order not found: ${opts.orderId}`);
    }

    if (order.status === "paid") {
      return { order, alreadyPaid: true as const };
    }

    if (order.status !== "pending") {
      throw new Error(`Order ${order.id} is ${order.status}, cannot mark paid`);
    }

    for (const item of order.items) {
      if (!item.variantId) {
        throw new Error(`Order item ${item.id} missing variantId`);
      }
      const variant = await tx.variant.findUnique({
        where: { id: item.variantId },
      });
      if (!variant || variant.stockQty < item.quantity) {
        throw new Error(
          `Insufficient stock at payment finalisation for ${item.sku}`,
        );
      }
    }

    for (const item of order.items) {
      await tx.variant.update({
        where: { id: item.variantId! },
        data: { stockQty: { decrement: item.quantity } },
      });
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "paid",
        providerPaymentId: opts.providerPaymentId,
        customerEmail: opts.customerEmail ?? order.customerEmail,
      },
      include: { items: true },
    });

    return { order: updated, alreadyPaid: false as const };
  });
}
