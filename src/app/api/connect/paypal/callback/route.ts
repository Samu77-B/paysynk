import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  connectStateCookieName,
  readConnectStoreId,
} from "@/lib/payments/oauth-state";

export const runtime = "nodejs";

function paymentsRedirect(req: Request, query: string) {
  const res = NextResponse.redirect(new URL(`/app/settings/payments?${query}`, req.url));
  res.cookies.delete(connectStateCookieName());
  return res;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const url = new URL(req.url);
  const merchantId = url.searchParams.get("merchantIdInPayPal");
  const trackingId = url.searchParams.get("merchantId");
  const cookie = (await cookies()).get(connectStateCookieName())?.value;
  const storeIdFromState = readConnectStoreId(cookie);
  const storeId = session.user.storeId;

  if (storeIdFromState && storeIdFromState !== storeId) {
    return paymentsRedirect(
      req,
      `error=${encodeURIComponent("PayPal connection expired. Try again.")}`,
    );
  }
  if (trackingId && trackingId !== storeId) {
    return paymentsRedirect(
      req,
      `error=${encodeURIComponent("PayPal connection did not match this shop.")}`,
    );
  }
  if (!merchantId) {
    return paymentsRedirect(
      req,
      `error=${encodeURIComponent("PayPal did not return a merchant id. Finish setup in PayPal and try again.")}`,
    );
  }

  await prisma.store.update({
    where: { id: storeId },
    data: { paypalMerchantId: merchantId, paymentsActive: true },
  });
  return paymentsRedirect(req, "connected=paypal");
}
