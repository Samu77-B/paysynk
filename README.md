# PaySynk

Multi-tenant, embeddable ecommerce by **Paradigm Studio** (alongside UrNextEvent / Salon Synk).

Merchants get a catalogue, stock, cart, and checkout. Shop UI can be **hosted** (`/s/:slug`) or **embedded**. Each store selects a payment provider; **Stripe Checkout** is implemented first. **FAC / PowerTranz** and **POS** are stubbed in the data model / provider interface only.

Domain: [paysynk.com](https://paysynk.com)

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Postgres + Prisma ORM 7 (`@prisma/adapter-pg`)
- Auth.js (NextAuth v5) credentials for merchant admin
- Stripe Checkout Sessions + signed webhooks

## Features (MVP)

| Area | What ships |
| --- | --- |
| Public API | `GET /api/stores/:slug/products`, `POST /api/stores/:slug/checkout` |
| Webhook | `POST /api/webhooks/stripe` — verify signature, mark paid, decrement stock (idempotent) |
| Storefront | `/s/slf` — products, variants, cart, checkout |
| Pricing | Tee £15, tote £8; **tee + tote bundle = £20**; UK shipping **£5.25** via Stripe `shipping_options` |
| Admin | `/admin` — stock edits, orders, store settings |
| Embed | `/embed.js` + homepage docs |
| Seed | Store `slf` (Saturday Love Funk) + full catalogue |

## Payment abstraction

```ts
// src/lib/payments/types.ts
interface PaymentProvider {
  createCheckout(input): Promise<{ redirectUrl: string; providerPaymentId: string }>
}
```

- `StripePaymentProvider` — full Checkout Session flow
- `FacPaymentProvider` — throws “not implemented”
- Store field `paymentProvider`: `stripe` | `fac`

**Security**

- Stripe secret keys only in server env (never `NEXT_PUBLIC_`)
- Prices & stock recomputed from the DB at checkout
- Stock re-checked when the webhook finalises payment
- Webhook signatures verified; paid handler is idempotent

**Shipping note:** UK flat rate is a Stripe Checkout `shipping_options` fixed amount (not a separate product line). Bundle discount is allocated onto tote line unit amounts (Stripe does not allow negative `unit_amount`).

## Setup (local)

### 1. Install

```bash
npm install
```

### 2. Database

Create a Postgres database and set `DATABASE_URL` to a **standard** `postgresql://…` (or `postgres://…`) URL.

Options:

- [Neon](https://neon.tech) free tier
- `npx create-db` (Prisma Postgres) — paste the returned `postgres://` URL
- Local Docker Postgres

Copy env:

```bash
cp .env.example .env
```

Fill in:

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from Stripe CLI in the next step
AUTH_SECRET=any-long-random-string
AUTH_URL=http://localhost:3000
```

### 3. Migrate + seed

```bash
npx prisma migrate dev --name init
npm run db:seed
```

Seed creates:

- Store **slf** — Saturday Love Funk (GBP, £5.25 shipping)
- Classic / Retro tees + tote with the stock matrix from the brief
- Merchant **merchant@slf.test** / **password123**

### 4. Stripe webhook (required for stock updates)

In a second terminal:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the CLI `whsec_…` into `STRIPE_WEBHOOK_SECRET`, then restart the app if it was already running.

### 5. Run the app

```bash
npm run dev
```

Open:

- Homepage: http://localhost:3000  
- Demo store: http://localhost:3000/s/slf  
- Admin: http://localhost:3000/admin/login  

### Definition of done check

1. Browse `/s/slf`, add one tee + one tote  
2. Cart shows items £23, bundle −£3 → **£20**, shipping **£5.25**, total **£25.25**  
3. Checkout → Stripe test card `4242 4242 4242 4242`  
4. With `stripe listen` running, order becomes `paid` and stock decreases  

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `start` | Production |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Seed SLF catalogue |
| `npm run db:studio` | Prisma Studio |

## Project layout

```
app/ (under src/)     Next.js routes — storefront, admin, APIs
components/           Storefront UI
lib/payments/         PaymentProvider + Stripe + FAC stub
lib/stripe via payments/stripe.ts
lib/pricing.ts        Bundle + shipping totals
lib/checkout.ts       Server-side validate → order → provider
prisma/schema.prisma  Store, Product, Variant, Order (+ channel online|pos)
prisma/seed.ts        SLF catalogue
public/embed.js       Embed snippet target
```

## TODOs (left intentional)

- FAC / PowerTranz provider implementation  
- Stripe Connect / per-merchant keys UX (MVP uses platform `STRIPE_SECRET_KEY`)  
- POS / till UI sharing products, stock, and `channel: pos` orders  
- Richer in-page embed widget (launcher ships today)

## Deploy (Vercel)

1. Push repo, import on Vercel  
2. Set the same env vars (use Neon or Prisma Postgres for `DATABASE_URL`)  
3. Add Stripe webhook endpoint: `https://<your-domain>/api/webhooks/stripe`  
4. Run migrations against production DB (`npx prisma migrate deploy`) and seed if needed  
