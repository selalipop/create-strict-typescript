---
name: orpc-patterns
description: Canonical pattern for adding an oRPC procedure and calling it from a React component in this project. Use when adding a new server endpoint, validating input with zod, or wiring a React Query call.
---

# oRPC patterns

This project uses oRPC (end-to-end typed RPC) with zod input validation. The pattern is: define a procedure → export it from the router → call it from a component via React Query.

## Files

| File | Purpose |
|---|---|
| `src/lib/orpc/baseProcedure.ts` | Declares the `base` procedure + the `RootContext` (what the server handler passes in) |
| `src/lib/orpc/router.ts` | Composes procedures into the exported `router`; exports `type Router = typeof router` |
| `src/lib/orpc/client.ts` | Isomorphic client — `window.location.origin` in the browser, `http://localhost:3000` on the server |
| `src/lib/orpc/query.ts` | `createTanstackQueryUtils(client)` → the `orpc` export used in components |
| `src/routes/api/v1/rpc.$.ts` | Mount — catch-all server route that dispatches to the router |

## Adding a procedure

```ts
// src/lib/orpc/router.ts
import { z } from "zod/v4";
import { base } from "./baseProcedure.ts";

export const router = {
  // ...existing procedures
  getBook: base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      // DB call, business logic, etc.
      return { id: input.id, title: "Example" };
    }),
};

export type Router = typeof router;
```

If this project has auth, you'll use `authenticated` / `anonymous` instead of `base` — see the `auth-seam` skill.

## Calling a procedure from a React component

```tsx
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/query.ts";

function Book({ id }: { id: string }) {
  const { data, isLoading } = useQuery(
    orpc.getBook.queryOptions({ input: { id } }),
  );
  if (isLoading) return <p>Loading...</p>;
  return <h1>{data?.title}</h1>;
}
```

For mutations: `useMutation(orpc.updateBook.mutationOptions())` → call `.mutate({ id, title })`.

## Zod version

Imports are from `"zod/v4"` (the v4 subpath), not `"zod"`. Don't mix — mixing produces subtle type mismatches where oRPC's inferred input type won't line up with the client's input.

## Context

`RootContext` (from `baseProcedure.ts`) is what the mount point passes in (usually `{ cookieAdapter }` plus auth fields once middleware runs). Procedures receive this as `context` in their handler. If you need something request-scoped (DB handle per-request, logger with trace id), extend `RootContext` there, update the mount in `rpc.$.ts`, and a middleware if it's derived.

## Errors

Throw to signal failure — oRPC serializes `Error` instances. For typed errors, use `ORPCError`:

```ts
import { ORPCError } from "@orpc/server";

throw new ORPCError("NOT_FOUND", { message: "Book not found" });
```

## Anti-patterns

- Defining a procedure inline inside a route or component. Keep them in `src/lib/orpc/router.ts` (or a file imported by it) so type inference works cleanly.
- Skipping zod validation because the input "looks fine". The input schema is documentation and protection — use `z.unknown()` only if you truly need it and validate elsewhere.
- Calling `fetch("/api/v1/rpc")` directly. Use the client; the point is end-to-end types.
- Importing the router from a client component. The router imports server-only code (DB, secrets) — importing it in the browser bundle breaks SSR and leaks deps. Only import `type Router`, not the runtime value.

## Related skills

- `auth-seam` / `supabase-auth` (if present) — how `authenticated` / `anonymous` wrappers work
- `drizzle-workflow` (if present) — how to get a db handle into the oRPC context
