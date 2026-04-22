import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const things = sqliteTable("things", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  ownerId: text("owner_id").notNull(),
  createdAt: int("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s','now') * 1000)`),
});

export type Thing = typeof things.$inferSelect;
export type NewThing = typeof things.$inferInsert;
