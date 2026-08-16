import type { MerchantUser, Store } from "@/generated/prisma/client";

export function serializeSignup(
  store: Store & { users: MerchantUser[] },
) {
  const owner = store.users[0];
  return {
    id: store.id,
    platform: "paysynk" as const,
    name: store.name,
    slug: store.slug,
    shopUrl: `/s/${store.slug}`,
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
