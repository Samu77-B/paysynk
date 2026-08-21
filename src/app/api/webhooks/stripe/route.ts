import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/payments";
import { markOrderPaidIdempotent } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import {
  sendPaidOrderEmails,
  type ShippingBits,
} from "@/lib/email/order-emails";
import { shippingBitsFromJson } from "@/lib/checkout-customer";

export const runtime = "nodejs";

function shippingFromSession(session: Stripe.Checkout.Session): ShippingBits | null {
  const details = session.collected_information?.shipping_details;
  const address = details?.address ?? session.customer_details?.address;
  const name = details?.name ?? session.customer_details?.name;
  if (!name && !address) return null;
  return {
    name,
    line1: address?.line1,
    line2: address?.line2,
    city: address?.city,
    postalCode: address?.postal_code,
    country: address?.country,
  };
}

/**
 * Stripe webhook — verify signature, mark order paid, decrement stock.
 * Idempotent: duplicate checkout.session.completed events are safe.
 */
export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId =
        session.metadata?.orderId || session.client_reference_id || undefined;

      if (!orderId) {
        console.error("checkout.session.completed missing orderId", session.id);
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      }

      if (session.payment_status !== "paid" && session.status !== "complete") {
        // Still allow complete sessions; unpaid shouldn't finalize stock
        if (session.payment_status && session.payment_status !== "paid") {
          return NextResponse.json({ received: true, skipped: true });
        }
      }

      const customerName =
        session.customer_details?.name ??
        session.collected_information?.shipping_details?.name ??
        null;

      const result = await markOrderPaidIdempotent({
        orderId,
        providerPaymentId: session.id,
        customerEmail: session.customer_details?.email ?? session.customer_email,
        customerName,
      });

      console.log(
        result.alreadyPaid
          ? `Order ${orderId} already paid (idempotent)`
          : `Order ${orderId} marked paid; stock decremented`,
      );

      if (!result.alreadyPaid) {
        const paidOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true, store: { include: { users: true } } },
        });
        if (paidOrder) {
          try {
            await sendPaidOrderEmails({
              order: paidOrder,
              shipping:
                shippingFromSession(session) ??
                shippingBitsFromJson(paidOrder.shippingAddress),
            });
          } catch (err) {
            console.error("Order emails failed", orderId, err);
          }
        }
      }
    }

    if (event.type === "account.application.deauthorized") {
      const accountId =
        typeof event.account === "string" ? event.account : null;
      if (accountId) {
        const stores = await prisma.store.findMany({
          where: { stripeConnectId: accountId },
          select: { id: true, paypalMerchantId: true },
        });
        for (const store of stores) {
          await prisma.store.update({
            where: { id: store.id },
            data: {
              stripeConnectId: null,
              paymentsActive: Boolean(store.paypalMerchantId),
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
