import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSecret() {
  return requiredEnv("ADMIN_SESSION_SECRET");
}

export function getAdminCredentials() {
  return {
    username: requiredEnv("ADMIN_USERNAME"),
    password: requiredEnv("ADMIN_PASSWORD"),
  };
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createAdminSessionToken() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${expiresAt}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined) {
  if (!token) return false;

  const [expiresAtRaw, signatureRaw] = token.split(".");
  if (!expiresAtRaw || !signatureRaw) return false;

  const expected = sign(expiresAtRaw);
  const provided = Buffer.from(signatureRaw, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");

  if (provided.length !== expectedBuf.length) return false;
  if (!timingSafeEqual(provided, expectedBuf)) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) return false;
  return Date.now() < expiresAt;
}
