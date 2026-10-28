import { ADMIN_COOKIE_NAME, createAdminToken, validateAdminCode } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { code?: string };
    if (!payload.code || !(await validateAdminCode(payload.code))) return Response.json({ error: "That admin code is not correct." }, { status: 401 });
    const token = await createAdminToken();
    const isSecure = new URL(request.url).protocol === "https:";
    const cookie = [`${ADMIN_COOKIE_NAME}=${token}`, "Path=/", "HttpOnly", isSecure ? "SameSite=None" : "SameSite=Lax", "Max-Age=28800", isSecure ? "Secure" : ""].filter(Boolean).join("; ");
    return Response.json({ ok: true }, { headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to sign in." }, { status: 500 });
  }
}
