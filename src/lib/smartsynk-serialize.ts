import type { Prisma } from "@/generated/prisma/client";

type StoreWithUsers = Prisma.StoreGetPayload<{
  include: { users: true };
}>;

function publicShopOrigin() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.paysynk.com";
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProto.replace(/\/$/, ""));
    if (
      url.hostname === "paysynk.com" ||
      url.hostname === "paysynk.vercel.app" ||
      url.hostname.endsWith(".vercel.app")
    ) {
      url.hostname = "www.paysynk.com";
    }
    url.protocol = "https:";
    return url.origin;
  } catch {
    return "https://www.paysynk.com";
  }
}

export function serializeSignup(store: StoreWithUsers) {
  const owner = store.users[0];
  return {
    id: store.id,
    platform: "paysynk" as const,
    name: store.name,
    slug: store.slug,
    shopUrl: `${publicShopOrigin()}/s/${store.slug}`,
    signupStatus: store.signupStatus,
    adminNotes: store.adminNotes,
    paymentsActive: store.paymentsActive,
    createdAt: store.createdAt.toISOString(),
    owner: owner
      ? {
          id: owner.id,
          name: owner.name,
          email: owner.email,
        }
      : null,
  };
}
