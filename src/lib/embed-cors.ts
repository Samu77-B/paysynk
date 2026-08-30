import { NextResponse } from "next/server";

/** Allow merchant sites to call store APIs from embed/cart scripts. */
export function withEmbedCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export function embedCorsPreflight() {
  return withEmbedCors(new NextResponse(null, { status: 204 }));
}

export function slugifyProductKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Older Copy-snippet slugs dropped accented letters (Kérastase → k-rastase). */
export function legacySlugifyProductKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
