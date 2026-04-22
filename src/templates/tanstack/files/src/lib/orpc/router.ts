import { z } from "zod/v4";
import { base } from "./baseProcedure.ts";

export const router = {
  health: base.handler(() => ({ status: "ok" as const, timestamp: Date.now() })),
  hello: base.input(z.object({ name: z.string() })).handler(({ input }) => ({
    greeting: `Hello, ${input.name}!`,
  })),
};

export type Router = typeof router;
