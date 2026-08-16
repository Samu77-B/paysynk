import type { Prisma } from "@/generated/prisma/client";

type StoreWithUsers = Prisma.StoreGetPayload<{
  include: { users: true };
}>;

export function serializeSignup(store: StoreWithUsers) {
  const owner = store.users[0];
  return {
    id: store.id,
    platform: "paysynk" as const,
    name: store.name,
    slug: store.slug,
    shopUrl: `${(process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://www.paysynk.com")}/s/${store.slug}`,
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
