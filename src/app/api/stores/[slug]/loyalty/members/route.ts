import { NextResponse } from "next/server";
import { findStoreByPublicSlug } from "@/lib/store-lookup";
import {
  isLoyaltyEmail,
  loyaltyKeyMatches,
  normalizeLoyaltyEmail,
  readLoyaltyBearer,
  serializeMember,
} from "@/lib/loyalty";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

/** SalonSynk desk: look up a member by email. */
export async function GET(req: Request, { params }: Params) {
  const { slug } = await params;
  const store = await findStoreByPublicSlug(slug);
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  if (!loyaltyKeyMatches(readLoyaltyBearer(req), store.loyaltyApiKeyHash)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!store.loyaltyEnabled) {
    return NextResponse.json(
      { error: "Points club is not on for this shop." },
      { status: 403 },
    );
  }

  const email = normalizeLoyaltyEmail(
    new URL(req.url).searchParams.get("email"),
  );
  if (!isLoyaltyEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const member = await prisma.loyaltyMember.findUnique({
    where: { storeId_email: { storeId: store.id, email } },
  });
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const payload = await serializeMember(member.id);
  return NextResponse.json({
    member: payload,
    productPtsPerPound: store.loyaltyProductPtsPerPound,
    servicePtsPerPound: store.loyaltyServicePtsPerPound,
  });
}
