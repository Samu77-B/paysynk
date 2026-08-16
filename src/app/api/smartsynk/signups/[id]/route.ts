import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSmartSynkAuth } from "@/lib/smartsynk-auth";
import { serializeSignup } from "@/lib/smartsynk-serialize";

const patchSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  adminNotes: z.string().optional(),
  name: z.string().trim().min(1).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const denied = requireSmartSynkAuth(request);
  if (denied) return denied;

  const { id } = await params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.store.findUnique({
    where: { id },
    include: { users: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Signup not found" }, { status: 404 });
  }

  const store = await prisma.store.update({
    where: { id },
    data: {
      ...(parsed.data.status ? { signupStatus: parsed.data.status } : {}),
      ...(parsed.data.adminNotes !== undefined
        ? { adminNotes: parsed.data.adminNotes }
        : {}),
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
    },
    include: { users: { orderBy: { createdAt: "asc" }, take: 1 } },
  });

  return NextResponse.json({ signup: serializeSignup(store) });
}
