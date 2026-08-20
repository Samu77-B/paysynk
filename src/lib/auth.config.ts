import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  trustHost: true,
  providers: [Credentials],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          storeId?: string;
          storeSlug?: string;
        };
        token.storeId = u.storeId;
        token.storeSlug = u.storeSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.storeId = (token.storeId as string) ?? "";
        session.user.storeSlug = (token.storeSlug as string) ?? "";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
