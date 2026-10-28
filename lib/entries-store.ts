import "server-only";

import { Redis } from "@upstash/redis";

export type GenderValue = "female" | "male" | "other";

export type ChallengeEntry = {
  id: number;
  name: string;
  gender: GenderValue;
  score: number;
  createdAt: string;
};

const ENTRIES_KEY = "nera:whoop:entries:v1";
const NEXT_ID_KEY = "nera:whoop:entries:next-id:v1";

let redis: Redis | undefined;

function getRedis() {
  if (!redis) redis = Redis.fromEnv();
  return redis;
}

export async function listEntries() {
  const values = await getRedis().lrange<ChallengeEntry | string>(ENTRIES_KEY, -5000, -1);

  return values
    .map((value) => (typeof value === "string" ? JSON.parse(value) as ChallengeEntry : value))
    .filter(isChallengeEntry)
    .sort((left, right) => right.score - left.score || right.id - left.id);
}

export async function createEntry(input: Omit<ChallengeEntry, "id" | "createdAt">) {
  const id = await getRedis().incr(NEXT_ID_KEY);
  const entry: ChallengeEntry = {
    id,
    ...input,
    createdAt: new Date().toISOString(),
  };

  await getRedis().rpush(ENTRIES_KEY, entry);
  return entry;
}

export async function deleteEntry(id: number) {
  const values = await getRedis().lrange<ChallengeEntry | string>(ENTRIES_KEY, 0, -1);
  const entry = values
    .map((value) => (typeof value === "string" ? JSON.parse(value) as ChallengeEntry : value))
    .find((value) => isChallengeEntry(value) && value.id === id);

  if (!entry) return false;
  await getRedis().lrem(ENTRIES_KEY, 1, entry);
  return true;
}

function isChallengeEntry(value: unknown): value is ChallengeEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<ChallengeEntry>;
  return typeof entry.id === "number"
    && typeof entry.name === "string"
    && (entry.gender === "female" || entry.gender === "male" || entry.gender === "other")
    && typeof entry.score === "number"
    && typeof entry.createdAt === "string";
}
