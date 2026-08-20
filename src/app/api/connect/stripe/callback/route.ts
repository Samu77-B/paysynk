import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  connectStateCookieName,
  readConnectStoreId,
} from "@/lib/payments/oauth-state";
import { exchangeStripeConnectCode } from "@/lib/payments/stripe-connect";

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
  const error = url.searchParams.get("error");
  if (error) {
    return paymentsRedirect(
      req,
      `error=${encodeURIComponent("Stripe connection was cancelled.")}`,
    );
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = (await cookies()).get(connectStateCookieName())?.value;
  const storeId = readConnectStoreId(state) ?? readConnectStoreId(cookie);

  if (!code || !storeId || storeId !== session.user.storeId) {
    return paymentsRedirect(
      req,
      `error=${encodeURIComponent("Stripe connection expired. Try again.")}`,
    );
  }

  try {
    const accountId = await exchangeStripeConnectCode(code);
    await prisma.store.update({
      where: { id: storeId },
      data: { stripeConnectId: accountId, paymentsActive: true },
    });
    return paymentsRedirect(req, "connected=stripe");
  } catch (err) {
    console.error("Stripe Connect callback failed", err);
    return paymentsRedirect(
      req,
      `error=${encodeURIComponent("Could not connect Stripe. Try again.")}`,
    );
  }
}
