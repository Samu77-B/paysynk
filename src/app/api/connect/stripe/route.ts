import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  connectCookieOptions,
  connectStateCookieName,
  signConnectState,
} from "@/lib/payments/oauth-state";
import { stripeConnectAuthorizeUrl } from "@/lib/payments/stripe-connect";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const state = signConnectState(session.user.storeId);
    const url = stripeConnectAuthorizeUrl({ state, requestUrl: req.url });
    const res = NextResponse.redirect(url);
    res.cookies.set(connectStateCookieName(), state, connectCookieOptions());
    return res;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe Connect is not configured";
    return NextResponse.redirect(
      new URL(
        `/app/settings/payments?error=${encodeURIComponent(message)}`,
        req.url,
      ),
    );
  }
}
