import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const challengeEntries = sqliteTable(
  "challenge_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    gender: text("gender", { enum: ["female", "male", "other"] }).notNull(),
    score: integer("score").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("challenge_entries_score_idx").on(table.score),
    index("challenge_entries_name_idx").on(table.name),
    index("challenge_entries_gender_idx").on(table.gender),
  ],
);
