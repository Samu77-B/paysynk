import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function requireSmartSynkAuth(request: Request): NextResponse | null {
  const expected = process.env.SMARTSYNK_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!expected) {
    return NextResponse.json(
      { error: "SmartSynk API is not configured" },
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const alt = request.headers.get("x-smartsynk-key")?.trim() ?? "";
  const token = bearer || alt;
  if (!token) {
    return NextResponse.json(
      { error: "Missing API key (no Authorization header reached PaySynk)" },
      { status: 401 },
    );
  }
  if (!safeEqual(token, expected)) {
    return NextResponse.json(
      { error: "Unauthorized (key does not match SMARTSYNK_API_KEY)" },
      { status: 401 },
    );
  }
  return null;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}

export function slugifyStoreName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
