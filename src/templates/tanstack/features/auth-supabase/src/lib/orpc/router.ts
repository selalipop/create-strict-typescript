import { z } from "zod/v4";
import { thingsStore } from "@/server/things-store.ts";
import { anonymous, authenticated, unauthenticated } from "./authMiddleware.ts";

export const router = {
  health: unauthenticated.handler(() => ({ status: "ok" as const, timestamp: Date.now() })),

  me: authenticated.handler(({ context }) => ({ user: context.user })),

  things: {
    list: anonymous.handler(() => thingsStore.list()),
    create: authenticated
      .input(z.object({ title: z.string().min(1).max(120) }))
      .handler(({ input, context }) =>
        thingsStore.create({ title: input.title, ownerId: context.user.id }),
      ),
    delete: authenticated
      .input(z.object({ id: z.string() }))
      .handler(({ input }) => ({ deleted: thingsStore.delete(input.id) })),
  },
};

export type Router = typeof router;
