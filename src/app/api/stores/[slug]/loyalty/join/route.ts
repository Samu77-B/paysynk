import { NextResponse } from "next/server";
import { z } from "zod";
import { findStoreByPublicSlug } from "@/lib/store-lookup";
import { embedCorsPreflight, withEmbedCors } from "@/lib/embed-cors";
import {
  isLoyaltyEmail,
  joinLoyaltyMember,
  normalizeLoyaltyEmail,
} from "@/lib/loyalty";

type Params = { params: Promise<{ slug: string }> };

const bodySchema = z.object({
  email: z.string().min(1).max(120),
  name: z.string().max(80).optional(),
  phone: z.string().max(30).optional(),
});

export async function OPTIONS() {
  return embedCorsPreflight();
}

/** Public join for the salon website form and checkout. */
export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;
  const store = await findStoreByPublicSlug(slug);
  if (!store) {
    return withEmbedCors(
      NextResponse.json({ error: "Store not found" }, { status: 404 }),
    );
  }
  if (!store.loyaltyEnabled) {
    return withEmbedCors(
      NextResponse.json({ error: "Points club is not on for this shop." }, { status: 403 }),
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return withEmbedCors(
      NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    );
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return withEmbedCors(
      NextResponse.json({ error: "Enter your name and email." }, { status: 400 }),
    );
  }
  const email = normalizeLoyaltyEmail(parsed.data.email);
  if (!isLoyaltyEmail(email)) {
    return withEmbedCors(
      NextResponse.json({ error: "Enter a valid email address." }, { status: 400 }),
    );
  }

  const result = await joinLoyaltyMember({
    storeId: store.id,
    email,
    name: parsed.data.name,
    phone: parsed.data.phone,
  });
  if ("error" in result) {
    return withEmbedCors(
      NextResponse.json({ error: result.error }, { status: 400 }),
    );
  }

  return withEmbedCors(
    NextResponse.json({
      ok: true,
      email: result.member.email,
      name: result.member.name,
      balance: result.balance,
      productPtsPerPound: store.loyaltyProductPtsPerPound,
      servicePtsPerPound: store.loyaltyServicePtsPerPound,
    }),
  );
}
