import "server-only";

import { env } from "cloudflare:workers";

export const ADMIN_COOKIE_NAME = "nera_admin_session";

function requiredEnv(name: "ADMIN_CODE" | "ADMIN_SESSION_SECRET") {
  const value = env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function sha256(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  const length = Math.max(left.length, right.length);
  let result = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) result |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  return result === 0;
}

export async function validateAdminCode(code: string) {
  const [submitted, expected] = await Promise.all([sha256(code), sha256(requiredEnv("ADMIN_CODE"))]);
  return constantTimeEqual(submitted, expected);
}

export async function createAdminToken() {
  return sha256(`${requiredEnv("ADMIN_CODE")}:${requiredEnv("ADMIN_SESSION_SECRET")}`);
}

export async function requestHasAdminSession(request: Request) {
  const token = (request.headers.get("cookie") || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(ADMIN_COOKIE_NAME.length + 1);
  return token ? constantTimeEqual(token, await createAdminToken()) : false;
}
