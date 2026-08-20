import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { capturePaypalOrder } from "@/lib/payments/paypal";
import { markOrderPaidIdempotent } from "@/lib/orders";
import { sendPaidOrderEmails } from "@/lib/email/order-emails";
import { resolveAppOrigin } from "@/lib/app-url";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = resolveAppOrigin(req.url);
  const orderId = url.searchParams.get("order");
  const paypalOrderId = url.searchParams.get("token");

  if (!orderId || !paypalOrderId) {
    return NextResponse.redirect(`${origin}/`);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { store: true },
  });
  if (!order) {
    return NextResponse.redirect(`${origin}/`);
  }

  const success = `${origin}/s/${order.store.slug}/success?order=${order.id}`;

  try {
    const captured = await capturePaypalOrder(paypalOrderId);
    if (captured.orderId && captured.orderId !== order.id) {
      throw new Error("PayPal order mismatch");
    }
    const result = await markOrderPaidIdempotent({
      orderId: order.id,
      providerPaymentId: paypalOrderId,
      customerEmail: captured.customerEmail,
      customerName: captured.customerName,
    });
    if (!result.alreadyPaid) {
      const paidOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true, store: { include: { users: true } } },
      });
      if (paidOrder) {
        await sendPaidOrderEmails({ order: paidOrder }).catch((err) => {
          console.error("PayPal order emails failed", order.id, err);
        });
      }
    }
  } catch (err) {
    console.error("PayPal capture failed", err);
  }

  return NextResponse.redirect(success);
}
