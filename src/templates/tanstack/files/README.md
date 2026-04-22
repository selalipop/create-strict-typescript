# {{name}}

A full-stack [TanStack Start](https://tanstack.com/start) app with [oRPC](https://orpc.unnoq.com) and a strict TypeScript baseline (Biome + Oxlint + tsgo).

## Scripts

- `{{pm}} dev` — start the dev server on http://localhost:3000
- `{{pm}} build` — SSR production build
- `{{pm}} lint` — Biome + Oxlint + typecheck
- `{{pm}} fix` — auto-fix lint issues

## Structure

- `src/routes/` — file-based routing
- `src/routes/api/v1/rpc.$.ts` — oRPC handler mount
- `src/lib/orpc/` — oRPC router, base procedure, isomorphic client, React Query bindings

## Adding a procedure

1. Add a handler in `src/lib/orpc/router.ts`:
   ```ts
   import { z } from "zod/v4";
   import { base } from "./baseProcedure.ts";

   export const router = {
     // existing procedures...
     myThing: base.input(z.object({ name: z.string() })).handler(({ input }) => ({ ok: true })),
   };
   ```
2. Call it from a component:
   ```tsx
   import { useQuery } from "@tanstack/react-query";
   import { orpc } from "@/lib/orpc/query.ts";

   const { data } = useQuery(orpc.myThing.queryOptions({ input: { name: "world" } }));
   ```
