// In-memory demo store. Data is wiped on server restart.
// Swap this file for a real DB (see the `drizzle` feature or the `drizzle-workflow` skill).

export interface Thing {
  id: string;
  title: string;
  createdAt: number;
  ownerId: string;
}

const items = new Map<string, Thing>();

seed();

export const thingsStore = {
  list(): Thing[] {
    return [...items.values()].sort((a, b) => b.createdAt - a.createdAt);
  },
  create(input: { title: string; ownerId: string }): Thing {
    const thing: Thing = {
      id: crypto.randomUUID(),
      title: input.title,
      createdAt: Date.now(),
      ownerId: input.ownerId,
    };
    items.set(thing.id, thing);
    return thing;
  },
  delete(id: string): boolean {
    return items.delete(id);
  },
};

function seed(): void {
  if (items.size > 0) {
    return;
  }
  const seedOwnerId = "demo-owner";
  thingsStore.create({ title: "Read the orpc-patterns skill", ownerId: seedOwnerId });
  thingsStore.create({ title: "Try a mutation from the homepage", ownerId: seedOwnerId });
  thingsStore.create({ title: "Swap the in-memory store for Drizzle", ownerId: seedOwnerId });
}
