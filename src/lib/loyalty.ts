import { createHash, randomBytes } from "crypto";
import type {
  LoyaltyEntryKind,
  Store,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { secretsEqual } from "@/lib/secret-compare";

export type LoyaltyStoreBits = Pick<
  Store,
  | "id"
  | "loyaltyEnabled"
  | "loyaltyProductPtsPerPound"
  | "loyaltyServicePtsPerPound"
  | "loyaltyRedeemPtsPerPound"
  | "loyaltyApiKeyHash"
>;

export function generateLoyaltyApiKey() {
  return `psk_${randomBytes(24).toString("base64url")}`;
}

export function hashLoyaltyApiKey(key: string) {
  return createHash("sha256").update(key.trim()).digest("hex");
}

export function loyaltyKeyMatches(
  presented: string | null | undefined,
  storedHash: string | null | undefined,
) {
  const token = presented?.trim() || "";
  const hash = storedHash?.trim() || "";
  if (!token || !hash) return false;
  return secretsEqual(hashLoyaltyApiKey(token), hash);
}

export function readLoyaltyBearer(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const alt = request.headers.get("x-paysynk-loyalty-key")?.trim() || "";
  return bearer || alt;
}

export function normalizeLoyaltyEmail(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 120);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isLoyaltyEmail(value: string) {
  return EMAIL_RE.test(value);
}

/** Whole pounds only. Negative spend voids the matching positive points. */
export function pointsFromSpend(amountMinor: number, ptsPerPound: number) {
  if (!Number.isFinite(amountMinor) || amountMinor === 0) return 0;
  if (!Number.isFinite(ptsPerPound) || ptsPerPound < 0) return 0;
  const sign = amountMinor < 0 ? -1 : 1;
  const pounds = Math.floor(Math.abs(amountMinor) / 100);
  return sign * pounds * ptsPerPound;
}

export function rateForKind(
  store: LoyaltyStoreBits,
  kind: LoyaltyEntryKind,
) {
  if (kind === "product") return store.loyaltyProductPtsPerPound;
  if (kind === "service") return store.loyaltyServicePtsPerPound;
  if (kind === "redeem") return store.loyaltyRedeemPtsPerPound ?? 0;
  return 0;
}

export async function memberBalance(memberId: string) {
  const agg = await prisma.loyaltyEntry.aggregate({
    where: { memberId },
    _sum: { points: true },
  });
  return agg._sum.points ?? 0;
}

export async function joinLoyaltyMember(opts: {
  storeId: string;
  email: string;
  name?: string | null;
  phone?: string | null;
}) {
  const email = normalizeLoyaltyEmail(opts.email);
  if (!isLoyaltyEmail(email)) {
    return { error: "Enter a valid email address." as const };
  }
  const name = opts.name?.trim().slice(0, 80) || null;
  const phone = opts.phone?.trim().slice(0, 30) || null;

  const member = await prisma.loyaltyMember.upsert({
    where: { storeId_email: { storeId: opts.storeId, email } },
    create: { storeId: opts.storeId, email, name, phone },
    update: {
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {}),
    },
  });
  const balance = await memberBalance(member.id);
  return { member, balance, created: true as const };
}

export async function earnLoyaltyPoints(opts: {
  store: LoyaltyStoreBits;
  email: string;
  name?: string | null;
  phone?: string | null;
  kind: LoyaltyEntryKind;
  amountMinor: number;
  source: string;
  sourceId: string;
  note?: string | null;
  /** When false, skip if they have not joined the club. */
  createMember: boolean;
  /** For adjust/redeem, pass points explicitly. */
  points?: number;
}) {
  if (!opts.store.loyaltyEnabled) {
    return { skipped: "disabled" as const };
  }
  const email = normalizeLoyaltyEmail(opts.email);
  if (!isLoyaltyEmail(email)) {
    return { error: "Enter a valid email address." as const };
  }
  const source = opts.source.trim().slice(0, 40) || "staff";
  const sourceId = opts.sourceId.trim().slice(0, 120);
  if (!sourceId) {
    return { error: "A booking or order id is required." as const };
  }

  const existing = await prisma.loyaltyEntry.findUnique({
    where: {
      storeId_source_sourceId: {
        storeId: opts.store.id,
        source,
        sourceId,
      },
    },
  });
  if (existing) {
    const member = await prisma.loyaltyMember.findUnique({
      where: { id: existing.memberId },
    });
    const balance = member ? await memberBalance(member.id) : 0;
    return { entry: existing, member, balance, idempotent: true as const };
  }

  let member = await prisma.loyaltyMember.findUnique({
    where: { storeId_email: { storeId: opts.store.id, email } },
  });
  if (!member) {
    if (!opts.createMember) {
      return { skipped: "not-a-member" as const };
    }
    const joined = await joinLoyaltyMember({
      storeId: opts.store.id,
      email,
      name: opts.name,
      phone: opts.phone,
    });
    if ("error" in joined && joined.error) return joined;
    member = joined.member;
  }

  const points =
    typeof opts.points === "number" && Number.isFinite(opts.points)
      ? Math.trunc(opts.points)
      : pointsFromSpend(opts.amountMinor, rateForKind(opts.store, opts.kind));

  if (points === 0 && opts.kind !== "adjust") {
    return { skipped: "zero-points" as const, member };
  }

  try {
    const entry = await prisma.loyaltyEntry.create({
      data: {
        storeId: opts.store.id,
        memberId: member.id,
        kind: opts.kind,
        points,
        amountMinor: Math.trunc(opts.amountMinor) || 0,
        source,
        sourceId,
        note: opts.note?.trim().slice(0, 200) || null,
      },
    });
    const balance = await memberBalance(member.id);
    return { entry, member, balance, idempotent: false as const };
  } catch (err) {
    const again = await prisma.loyaltyEntry.findUnique({
      where: {
        storeId_source_sourceId: {
          storeId: opts.store.id,
          source,
          sourceId,
        },
      },
    });
    if (again) {
      const balance = await memberBalance(member.id);
      return { entry: again, member, balance, idempotent: true as const };
    }
    throw err;
  }
}

export async function awardPaidOrderPoints(order: {
  id: string;
  storeId: string;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  subtotalMinor: number;
  discountMinor: number;
}) {
  if (!order.customerEmail) return;
  const store = await prisma.store.findUnique({ where: { id: order.storeId } });
  if (!store) return;
  const merchandiseMinor = Math.max(0, order.subtotalMinor - order.discountMinor);
  return earnLoyaltyPoints({
    store,
    email: order.customerEmail,
    name: order.customerName,
    phone: order.customerPhone,
    kind: "product",
    amountMinor: merchandiseMinor,
    source: "order",
    sourceId: order.id,
    note: `Order ${order.id.slice(-8).toUpperCase()}`,
    createMember: false,
  });
}

export async function serializeMember(memberId: string) {
  const member = await prisma.loyaltyMember.findUnique({
    where: { id: memberId },
    include: {
      entries: { orderBy: { createdAt: "desc" }, take: 40 },
    },
  });
  if (!member) return null;
  const balance = await memberBalance(member.id);
  return {
    id: member.id,
    email: member.email,
    name: member.name,
    phone: member.phone,
    balance,
    joinedAt: member.createdAt.toISOString(),
    entries: member.entries.map((row) => ({
      id: row.id,
      kind: row.kind,
      points: row.points,
      amountMinor: row.amountMinor,
      source: row.source,
      sourceId: row.sourceId,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
