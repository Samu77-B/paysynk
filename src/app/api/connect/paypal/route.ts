import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  connectCookieOptions,
  connectStateCookieName,
  signConnectState,
} from "@/lib/payments/oauth-state";
import { createPaypalOnboardingUrl } from "@/lib/payments/paypal";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const state = signConnectState(session.user.storeId);
    const url = await createPaypalOnboardingUrl({
      storeId: session.user.storeId,
      requestUrl: req.url,
    });
    const res = NextResponse.redirect(url);
    res.cookies.set(connectStateCookieName(), state, connectCookieOptions());
    return res;
  } catch (err) {
    console.error("PayPal Connect start failed", err);
    const message =
      err instanceof Error ? err.message : "PayPal Connect is not configured";
    return NextResponse.redirect(
      new URL(
        `/app/settings/payments?error=${encodeURIComponent(message)}`,
        req.url,
      ),
    );
  }
}
