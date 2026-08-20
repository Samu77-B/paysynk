import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const COOKIE = "ps_connect_state";
const MAX_AGE_MS = 30 * 60 * 1000;

function secret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value) {
    throw new Error("AUTH_SECRET is not set");
  }
  return value;
}

export function connectStateCookieName() {
  return COOKIE;
}

export function signConnectState(storeId: string) {
  const nonce = randomBytes(16).toString("hex");
  const ts = String(Date.now());
  const payload = `${storeId}.${nonce}.${ts}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function readConnectStoreId(state: string | undefined | null): string | null {
  if (!state) return null;
  const parts = state.split(".");
  if (parts.length !== 4) return null;
  const [storeId, nonce, ts, sig] = parts;
  if (!storeId || !nonce || !ts || !sig) return null;
  const payload = `${storeId}.${nonce}.${ts}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const age = Date.now() - Number(ts);
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_MS) return null;
  return storeId;
}

export function connectCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  };
}
