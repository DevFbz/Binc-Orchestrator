import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "binc_session";

type SessionPayload = { email: string; role: string; exp: number };

function secret() { return process.env.BINC_AUTH_SECRET || "development-only-secret"; }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("hex"); }

export function authEnabled() { return Boolean(process.env.BINC_AUTH_EMAIL && process.env.BINC_AUTH_PASSWORD && process.env.BINC_AUTH_SECRET); }

export function verifyCredentials(email: string, password: string) {
  const expectedEmail = process.env.BINC_AUTH_EMAIL || "";
  const expectedPassword = process.env.BINC_AUTH_PASSWORD || "";
  return email === expectedEmail && password === expectedPassword;
}

export function createSession(email: string, role = "global_admin") {
  const payload: SessionPayload = { email, role, exp: Date.now() + 8 * 60 * 60 * 1000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function readSession(value?: string | null): SessionPayload | null {
  if (!value) return null;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as SessionPayload;
    return payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}
