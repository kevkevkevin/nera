import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const isSecure = new URL(request.url).protocol === "https:";
  const cookie = [`${ADMIN_COOKIE_NAME}=`, "Path=/", "HttpOnly", isSecure ? "SameSite=None" : "SameSite=Lax", "Max-Age=0", isSecure ? "Secure" : ""].filter(Boolean).join("; ");
  return Response.json({ ok: true }, { headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" } });
}
