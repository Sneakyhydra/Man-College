import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SEC,
  createAdminSessionToken,
  getAdminCredentials,
  timingSafeStringEqual,
} from "@/lib/admin-auth";

type Body = { username?: string; password?: string };

type AttemptBucket = { failures: number[]; lockedUntil?: number };
const loginAttempts = new Map<string, AttemptBucket>();
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const bucket = loginAttempts.get(key);
  if (!bucket) return false;
  if (bucket.lockedUntil && bucket.lockedUntil > now) return true;
  bucket.failures = bucket.failures.filter((t) => now - t < WINDOW_MS);
  if (bucket.failures.length >= MAX_FAILURES) {
    bucket.lockedUntil = now + WINDOW_MS;
    return true;
  }
  return false;
}

function recordFailure(key: string) {
  const now = Date.now();
  const bucket = loginAttempts.get(key) ?? { failures: [] };
  bucket.failures = bucket.failures.filter((t) => now - t < WINDOW_MS);
  bucket.failures.push(now);
  if (bucket.failures.length >= MAX_FAILURES) {
    bucket.lockedUntil = now + WINDOW_MS;
  }
  loginAttempts.set(key, bucket);
}

function clearFailures(key: string) {
  loginAttempts.delete(key);
}

export async function POST(request: Request) {
  const key = clientKey(request);
  if (isRateLimited(key)) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const valid = getAdminCredentials();
  const userOk = timingSafeStringEqual(
    body.username?.trim() ?? "",
    valid.username,
  );
  const passOk = timingSafeStringEqual(body.password ?? "", valid.password);

  if (!userOk || !passOk) {
    recordFailure(key);
    return NextResponse.json(
      { error: "Invalid admin credentials." },
      { status: 401 },
    );
  }

  clearFailures(key);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SEC,
  });

  return NextResponse.json({ success: true });
}
