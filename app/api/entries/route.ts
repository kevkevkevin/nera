import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { challengeEntries } from "@/db/schema";
import { requestHasAdminSession } from "@/lib/admin-auth";

const validGenders = new Set(["female", "male", "other"]);

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return message.includes("no such table") ? "The challenge board is being prepared. Please try again shortly." : message;
}

export async function GET(request: Request) {
  if (!(await requestHasAdminSession(request))) return Response.json({ error: "Admin access required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const entries = await getDb().select().from(challengeEntries).orderBy(desc(challengeEntries.score), desc(challengeEntries.id)).limit(5000);
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

    const [entry] = await getDb().insert(challengeEntries).values({ name, gender: gender as GenderValue, score }).returning();
    return Response.json({ entry }, { status: 201 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

type GenderValue = "female" | "male" | "other";
