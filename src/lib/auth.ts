import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Valid bcrypt hash so unknown-email logins take the same time as known ones. */
const DUMMY_PASSWORD_HASH =
  "$2b$10$g.Ymq0pUMBLUr1RQkekAs.ELBExf9BBjH1X1BDPdhxzNQAZOhdDtu";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

function loginThrottled(email: string) {
  const now = Date.now();
  const rec = loginAttempts.get(email);
  if (!rec || now >= rec.resetAt) {
    loginAttempts.set(email, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > LOGIN_MAX_ATTEMPTS;
}

function clearLoginThrottle(email: string) {
  loginAttempts.delete(email);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        if (loginThrottled(email)) return null;

        const user = await prisma.merchantUser.findUnique({
          where: { email },
          include: { store: true },
        });

        const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
        const ok = await bcrypt.compare(parsed.data.password, hash);
        if (!user || !ok) return null;

        clearLoginThrottle(email);
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          storeId: user.storeId,
          storeSlug: user.store.slug,
        };
      },
    }),
  ],
});
