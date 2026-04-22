import { z } from "zod/v4";
import { anonymous, authenticated, unauthenticated } from "./authMiddleware.ts";

export const router = {
  health: unauthenticated.handler(() => ({ status: "ok" as const })),
  hello: anonymous
    .input(z.object({ name: z.string() }))
    .handler(({ input, context }) => ({
      greeting: `Hello, ${input.name}!`,
      userId: context.user?.id,
    })),
  me: authenticated.handler(({ context }) => ({ user: context.user })),
};

export type Router = typeof router;
