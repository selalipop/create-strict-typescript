---
name: auth-seam
description: Explains the single-file auth extension seam this project uses (authService.getUserFromRequest) so swapping auth providers doesn't touch procedure code. Use when adding real auth, changing auth provider, or writing a procedure that needs user context.
---

# Auth seam

This project ships with a **placeholder** auth implementation. The seam is designed so swapping in a real provider (Supabase, Clerk, Auth0, better-auth, Lucia, etc.) is a one-file change — procedures never need to be updated.

## The seam

Exactly one function is the contract:

```ts
// src/lib/auth/authService.ts
export const authService = {
  async getUserFromRequest({
    cookieAdapter,
    allowAnonymous,
  }: {
    cookieAdapter: CookieAdapter;
    allowAnonymous: boolean;
  }): Promise<{ user: User | undefined; isAnonymousUser: boolean }> {
    // TODO: replace with real auth.
  },
};
```

Everything else — `authMiddleware`, `authenticated` / `anonymous` wrappers, `base` procedure — calls into this and is **stable** across providers.

## How procedures use it

```ts
// Always-authenticated: throws if no user
meProfile: authenticated.handler(({ context }) => context.user);

// Allows anonymous: user is optional
publicFeed: anonymous.handler(({ context }) => {
  if (context.user) { /* personalize */ }
});

// No auth lookup (e.g., /health): use unauthenticated
health: unauthenticated.handler(() => ({ status: "ok" }));
```

`authenticated` is the wrapper to use by default for any procedure that acts on behalf of a user. Only use `anonymous` when the procedure is intentionally public-but-personalized.

## Swapping the stub for a real provider

1. Add the provider's SDK to `dependencies` (e.g., `@supabase/ssr`).
2. Replace the body of `authService.getUserFromRequest` with the provider's session lookup, reading cookies via `cookieAdapter`.
3. Add any env vars to `.env.example`.
4. (If the provider has a callback redirect) add a route at `src/routes/api/v1/auth/callback.ts`.

**Don't change** `baseProcedure.ts`, `authMiddleware.ts`, `procedureTypes.ts`, or any procedure file — the whole point of the seam is those stay stable.

## Anti-patterns

- Reading cookies directly inside a procedure handler — always go through the context. Otherwise testing becomes painful and the seam leaks.
- Adding provider-specific fields (`supabase_session_id`, `clerk_user_id`) to the `User` type. Keep `User` provider-neutral (id, email) and stash provider details in the `authService` if needed.
- Bypassing `authenticated` with an ad-hoc check in the handler. The wrapper exists precisely to make authz a compile-time property of every procedure.

## Current stub behavior

The stub returns a fake user for `allowAnonymous: true`, throws for `allowAnonymous: false`. Swap it before shipping anything that matters.

## Related skills

- `orpc-patterns` — how procedures are composed
- `supabase-auth` (if present) — what the Supabase implementation of this seam looks like
