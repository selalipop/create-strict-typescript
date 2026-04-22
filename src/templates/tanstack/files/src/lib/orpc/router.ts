import { z } from "zod/v4";
import { thingsStore } from "@/server/things-store.ts";
import { base } from "./baseProcedure.ts";

export const router = {
  health: base.handler(() => ({ status: "ok" as const, timestamp: Date.now() })),

  hello: base
    .input(z.object({ name: z.string().min(1) }))
    .handler(({ input }) => ({ greeting: `Hello, ${input.name}!` })),

  things: {
    list: base.handler(() => thingsStore.list()),
    create: base
      .input(z.object({ title: z.string().min(1).max(120) }))
      .handler(({ input }) =>
        thingsStore.create({ title: input.title, ownerId: "anonymous" }),
      ),
    delete: base
      .input(z.object({ id: z.string() }))
      .handler(({ input }) => ({ deleted: thingsStore.delete(input.id) })),
  },
};

export type Router = typeof router;
