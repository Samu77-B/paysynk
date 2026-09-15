import { NextResponse } from "next/server";
import { z } from "zod";
import { findStoreByPublicSlug } from "@/lib/store-lookup";
import {
  earnLoyaltyPoints,
  loyaltyKeyMatches,
  readLoyaltyBearer,
} from "@/lib/loyalty";

type Params = { params: Promise<{ slug: string }> };

const bodySchema = z.object({
  email: z.string().min(1).max(120),
  name: z.string().max(80).optional(),
  phone: z.string().max(30).optional(),
  kind: z.enum(["service", "product", "adjust"]).optional(),
  amountMinor: z.number().int(),
  sourceId: z.string().min(1).max(120),
  source: z.string().max(40).optional(),
  note: z.string().max(200).optional(),
  points: z.number().int().optional(),
});

/** SalonSynk / till: credit (or void) points after a paid booking. */
export async function POST(req: Request, { params }: Params) {
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

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const kind = parsed.data.kind ?? "service";
  const result = await earnLoyaltyPoints({
    store,
    email: parsed.data.email,
    name: parsed.data.name,
    phone: parsed.data.phone,
    kind,
    amountMinor: parsed.data.amountMinor,
    source: parsed.data.source || "salonsynk",
    sourceId: parsed.data.sourceId,
    note: parsed.data.note,
    createMember: true,
    points: kind === "adjust" ? parsed.data.points : undefined,
  });

  if ("skipped" in result && result.skipped === "disabled") {
    return NextResponse.json(
      { error: "Points club is not on for this shop." },
      { status: 403 },
    );
  }
  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if ("skipped" in result && result.skipped === "zero-points") {
    return NextResponse.json({
      ok: true,
      skipped: "zero-points",
      email: parsed.data.email,
      points: 0,
      balance: result.member ? undefined : 0,
    });
  }

  if (!("entry" in result) || !result.entry || !result.member) {
    return NextResponse.json({ error: "Could not record points." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    idempotent: result.idempotent,
    email: result.member.email,
    points: result.entry.points,
    balance: result.balance,
    kind: result.entry.kind,
  });
}
