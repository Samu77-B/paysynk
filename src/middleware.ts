import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { safeInternalPath } from "@/lib/safe-path";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const loggedIn = Boolean(req.auth?.user);

  const isAdminLogin = path === "/admin/login";
  const isAdmin = path.startsWith("/admin");
  const isApp = path.startsWith("/app");

  if ((isApp || (isAdmin && !isAdminLogin)) && !loggedIn) {
    const login = new URL(isAdmin ? "/admin/login" : "/login", req.nextUrl.origin);
    if (isApp) login.searchParams.set("next", safeInternalPath(path));
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
