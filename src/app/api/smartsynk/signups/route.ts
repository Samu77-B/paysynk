import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSmartSynkAuth, slugifyStoreName } from "@/lib/smartsynk-auth";
import { serializeSignup } from "@/lib/smartsynk-serialize";

const createSchema = z.object({
  fullName: z.string().trim().min(1),
  storeName: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8).optional(),
  approve: z.boolean().optional(),
});

export async function GET(request: Request) {
  const denied = requireSmartSynkAuth(request);
  if (denied) return denied;

  const status = new URL(request.url).searchParams.get("status");
  const where =
    status === "pending" || status === "approved" || status === "rejected"
      ? { signupStatus: status }
      : {};

  const stores = await prisma.store.findMany({
    where,
    include: { users: { orderBy: { createdAt: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    platform: "paysynk",
    signups: stores.map(serializeSignup),
  });
}

export async function POST(request: Request) {
  const denied = requireSmartSynkAuth(request);
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const taken = await prisma.merchantUser.findUnique({ where: { email } });
  if (taken) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  let slug = slugifyStoreName(parsed.data.storeName) || "store";
  if (await prisma.store.findUnique({ where: { slug } })) {
    slug = `${slug}-${randomBytes(2).toString("hex")}`;
  }

  const generatedPassword =
    parsed.data.password ?? randomBytes(9).toString("base64url").slice(0, 12);
  const passwordHash = await bcrypt.hash(generatedPassword, 10);
  const approve = parsed.data.approve === true;

  const store = await prisma.store.create({
    data: {
      name: parsed.data.storeName,
      slug,
      signupStatus: approve ? "approved" : "pending",
      users: {
        create: {
          email,
          passwordHash,
          name: parsed.data.fullName,
        },
      },
    },
    include: { users: true },
  });

  return NextResponse.json(
    {
      signup: serializeSignup(store),
      temporaryPassword: parsed.data.password ? undefined : generatedPassword,
    },
    { status: 201 },
  );
}
