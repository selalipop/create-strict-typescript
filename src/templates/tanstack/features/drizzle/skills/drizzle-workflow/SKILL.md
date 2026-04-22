---
name: drizzle-workflow
description: Describes this project's Drizzle + SQLite workflow — schema.ts conventions, db:generate vs db:push, db:studio, type inference. Use when adding a table, changing a column, or running migrations.
---

# Drizzle workflow

This project uses Drizzle ORM with better-sqlite3. Schema is code-first: you edit `src/server/schema.ts`, Drizzle generates migrations.

## Files

| File | Purpose |
|---|---|
| `src/server/schema.ts` | All table definitions + `$inferSelect` / `$inferInsert` type exports |
| `src/server/db.ts` | The shared `db` handle (one SQLite connection, `drizzle(sqlite, { schema })`) |
| `drizzle.config.ts` | Tells `drizzle-kit` where the schema is and what dialect |
| `drizzle/` | Generated migration SQL (checked in; DO edit only under specific circumstances, see below) |
| `data.db` | Local SQLite file (gitignored; `DATABASE_URL` override in `.env`) |

## Scripts

- **`pnpm db:generate`** — read `schema.ts`, diff against `drizzle/` migrations, emit a new SQL migration. Run this after any schema change.
- **`pnpm db:push`** — apply the current schema directly to the database, skipping the migration files. Use for local dev iteration. **Don't use in production** — you'll desync from migration history.
- **`pnpm db:studio`** — opens a web UI to inspect / edit rows. Great for debugging.

## Adding a table

```ts
// src/server/schema.ts
import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  createdAt: int("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s','now') * 1000)`),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

Then run `pnpm db:generate` (for versioned migration) or `pnpm db:push` (quick dev loop).

## Using the db from an oRPC procedure

```ts
import { eq } from "drizzle-orm";
import { posts } from "@/server/schema.ts";
import { db } from "@/server/db.ts";

listPosts: authenticated.handler(async ({ context }) => {
  return db
    .select()
    .from(posts)
    .where(eq(posts.authorId, context.user.id));
}),
```

For procedures that need a transaction: `await db.transaction(async (tx) => { ... })`.

## Invariants

- Don't import `better-sqlite3` directly from components — only from `src/server/db.ts` + files that import it (server-side paths).
- Don't write raw SQL migrations inside `drizzle/` manually unless Drizzle's generated migration needs a data transform it can't express (rare). Document why in a commit.
- `schema.ts` is the single source of truth. `drizzle.config.ts` points to it; everything else derives.

## Anti-patterns

- Using `pnpm db:push` against production. Always use the versioned migration workflow once you care about data.
- Creating multiple `Database` / `drizzle()` instances. One per process; export from `src/server/db.ts`.
- Inlining schema definitions in a random file. Keep all tables in `schema.ts` (or co-located under a `schema/` directory) so Drizzle can discover them.

## Switching from SQLite to Postgres

Out of scope for this template, but the pattern: change `dialect` in `drizzle.config.ts`, swap `better-sqlite3` for `pg` / `postgres`, update `db.ts`, adjust column types where needed (`int` → `integer`, etc.).

## Related skills

- `orpc-patterns` — how to wire the `db` handle into procedure context if you want to swap the raw import pattern
