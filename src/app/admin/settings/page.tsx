import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/pricing";

async function updateSettings(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.storeId) redirect("/admin/login");

  const currency = String(formData.get("currency") || "gbp").toLowerCase();
  const shippingPounds = Number(formData.get("shippingPounds"));
  const notes = String(formData.get("stripeConfigNotes") || "");
  const paymentProvider = String(formData.get("paymentProvider") || "stripe");

  if (!["gbp", "usd", "eur", "jmd"].includes(currency)) return;
  if (!Number.isFinite(shippingPounds) || shippingPounds < 0) return;
  if (paymentProvider !== "stripe" && paymentProvider !== "fac") return;

  await prisma.store.update({
    where: { id: session.user.storeId },
    data: {
      currency,
      shippingFlatMinor: Math.round(shippingPounds * 100),
      stripeConfigNotes: notes,
      paymentProvider,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath(`/s/${session.user.storeSlug}`);
}

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/admin/login");

  const store = await prisma.store.findUniqueOrThrow({
    where: { id: session.user.storeId },
  });

  return (
    <main className="admin-page">
      <h1>Store settings</h1>
      <p className="muted">
        Currency, flat shipping, and payment provider. Stripe secret keys stay in
        server env — never in the browser.
      </p>

      <form action={updateSettings} className="stack-form settings-form">
        <label className="field">
          <span>Currency</span>
          <select name="currency" defaultValue={store.currency}>
            <option value="gbp">GBP</option>
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="jmd">JMD</option>
          </select>
        </label>

        <label className="field">
          <span>UK flat shipping (major units)</span>
          <input
            name="shippingPounds"
            type="number"
            step="0.01"
            min="0"
            defaultValue={(store.shippingFlatMinor / 100).toFixed(2)}
          />
          <span className="muted small">
            Current: {formatMoney(store.shippingFlatMinor, store.currency)} —
            applied via Stripe Checkout <code>shipping_options</code>
          </span>
        </label>

        <label className="field">
          <span>Payment provider</span>
          <select name="paymentProvider" defaultValue={store.paymentProvider}>
            <option value="stripe">stripe</option>
            <option value="fac">fac (stub — not implemented)</option>
          </select>
        </label>

        <label className="field">
          <span>Stripe config notes</span>
          <textarea
            name="stripeConfigNotes"
            rows={4}
            defaultValue={store.stripeConfigNotes ?? ""}
            placeholder="e.g. Use platform test key; Connect account acct_… TBD"
          />
        </label>

        <button type="submit" className="btn btn-primary">
          Save settings
        </button>
      </form>

      <section className="todo-box">
        <h2>Env wiring (server)</h2>
        <ul>
          <li>
            <code>STRIPE_SECRET_KEY</code> — platform/test secret (never
            NEXT_PUBLIC_)
          </li>
          <li>
            <code>STRIPE_WEBHOOK_SECRET</code> — from Stripe CLI or Dashboard
          </li>
          <li>
            <code>NEXT_PUBLIC_APP_URL</code> — e.g. http://localhost:3000
          </li>
        </ul>
        <p className="muted small">
          TODO: Stripe Connect / per-merchant keys UX. TODO: FAC / PowerTranz
          provider. TODO: POS UI on the same inventory.
        </p>
      </section>
    </main>
  );
}
