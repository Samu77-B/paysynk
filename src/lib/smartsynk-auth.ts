import { NextResponse } from "next/server";
import { secretsEqual } from "@/lib/secret-compare";

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function requireSmartSynkAuth(request: Request): NextResponse | null {
  const expected = process.env.SMARTSYNK_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!expected) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const alt = request.headers.get("x-smartsynk-key")?.trim() ?? "";
  const token = bearer || alt;
  if (!token || !secretsEqual(token, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function slugifyStoreName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
