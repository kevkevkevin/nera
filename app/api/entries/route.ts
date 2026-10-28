import { requestHasAdminSession } from "@/lib/admin-auth";
import { createEntry, deleteEntry, listEntries, type GenderValue } from "@/lib/entries-store";

const validGenders = new Set(["female", "male", "other"]);

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (message.includes("UPSTASH_REDIS_REST")) return "Score storage is not configured yet.";
  return "The challenge board is temporarily unavailable. Please try again.";
}

export async function GET(request: Request) {
  if (!(await requestHasAdminSession(request))) return Response.json({ error: "Admin access required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const entries = await listEntries();
    return Response.json({ entries }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { name?: string; gender?: string; score?: number };
    const name = payload.name?.trim().replace(/\s+/g, " ") || "";
    const gender = payload.gender || "";
    const score = Number(payload.score);
    if (name.length < 2 || name.length > 80) return Response.json({ error: "Please enter a name between 2 and 80 characters." }, { status: 400 });
    if (!validGenders.has(gender)) return Response.json({ error: "Please select a gender." }, { status: 400 });
    if (!Number.isInteger(score) || score < 0 || score > 999999) return Response.json({ error: "Score must be a whole number between 0 and 999,999." }, { status: 400 });

    const entry = await createEntry({ name, gender: gender as GenderValue, score });
    return Response.json({ entry }, { status: 201 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requestHasAdminSession(request))) return Response.json({ error: "Admin access required." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id < 1) return Response.json({ error: "A valid entry ID is required." }, { status: 400 });

    const removed = await deleteEntry(id);
    if (!removed) return Response.json({ error: "Entry not found." }, { status: 404 });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
