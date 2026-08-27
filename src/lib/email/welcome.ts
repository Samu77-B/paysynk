import type { MerchantUser, Store } from "@/generated/prisma/client";
import { resolveAppOrigin } from "@/lib/app-url";
import { sendMail } from "@/lib/email/send";
import { merchantWelcomeHtml } from "@/lib/email/templates";
import { ownerNotifyEmail } from "@/lib/email/order-emails";

type StoreWithUsers = Store & { users: MerchantUser[] };

export async function sendMerchantWelcomeEmail(store: StoreWithUsers) {
  const to = ownerNotifyEmail(store);
  if (!to) {
    console.warn("No owner email for welcome", store.slug);
    return { ok: false as const, error: "No owner email" };
  }

  const origin = resolveAppOrigin("https://www.paysynk.com");
  const ownerName = store.users[0]?.name?.trim() || "";

  return sendMail({
    storeName: "PaySynk",
    to,
    replyTo: "hello@paysynk.com",
    subject: `You're approved — ${store.name} is live on PaySynk`,
    html: merchantWelcomeHtml({
      ownerName,
      storeName: store.name,
      shopUrl: `${origin}/s/${store.slug}`,
      dashboardUrl: `${origin}/app`,
      loginUrl: `${origin}/login`,
    }),
  });
}
