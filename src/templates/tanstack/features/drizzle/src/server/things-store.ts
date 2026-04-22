import { desc, eq } from "drizzle-orm";
import { db } from "./db.ts";
import { things } from "./schema.ts";

export type Thing = typeof things.$inferSelect;

export const thingsStore = {
  list(): Thing[] {
    return db.select().from(things).orderBy(desc(things.createdAt)).all();
  },
  create(input: { title: string; ownerId: string }): Thing {
    const row: typeof things.$inferInsert = {
      id: crypto.randomUUID(),
      title: input.title,
      ownerId: input.ownerId,
    };
    db.insert(things).values(row).run();
    const inserted = db.select().from(things).where(eq(things.id, row.id)).get();
    if (!inserted) {
      throw new Error("Failed to create thing");
    }
    return inserted;
  },
  delete(id: string): boolean {
    const result = db.delete(things).where(eq(things.id, id)).run();
    return result.changes > 0;
  },
};
