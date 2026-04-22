---
name: supabase-auth
description: Explains this project's Supabase cookie-based auth wiring — @supabase/ssr adapter, server-client vs browser-client, PKCE callback route, env vars. Use when debugging auth flow, adding a login method, or configuring the Supabase project.
---

# Supabase auth

This project uses `@supabase/ssr` for cookie-based auth, with the session resolved on the server for each oRPC request.

## Files

| File | Purpose |
|---|---|
| `src/lib/supabase/browser-client.ts` | Browser-side Supabase client (reads `VITE_SUPABASE_*` at build time) |
| `src/lib/auth/authService.ts` | Server-side user resolution — the implementation of the auth seam |
| `src/routes/api/v1/auth/callback.ts` | PKCE code-for-session exchange (OAuth redirect target) |

## Env vars

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Both are `VITE_`-prefixed so Vite exposes them to the browser. The anon key is safe to expose — Supabase enforces row-level security. The service role key (if you ever need admin) is **not** in this project by design; never add it as `VITE_`.

## Client vs server

- **Browser**: use `supabase` from `src/lib/supabase/browser-client.ts` — this one handles client-side auth flows (email login, magic link, OAuth start).
- **Server (oRPC context, server functions, route loaders)**: create a scoped server client with `createServerClient(url, key, { cookies: { getAll, setAll } })`. The `cookieAdapter` from `RootContext` is already wired into this in `authService.ts`.

**Never** import the browser client on the server — it'll read `localStorage` which doesn't exist there.

## Login flows

- **Email + password**: `supabase.auth.signInWithPassword({ email, password })` on the browser. Sets cookies automatically.
- **Magic link / OAuth**: `supabase.auth.signInWithOtp(...)` / `signInWithOAuth(...)` — redirects the browser to Supabase, which then calls `/api/v1/auth/callback?code=...`. The callback route exchanges the code for a session cookie. Don't rename that callback path without updating the Supabase project's "Redirect URLs" setting.

## Typed user

`User` in `src/lib/auth/authService.ts` is deliberately minimal (`id`, `email`). Don't leak Supabase-specific fields into procedure code — extend the seam's implementation if you need more.

## Anti-patterns

- Reading `supabase.auth.getUser()` inside a procedure. Use `context.user` — it's already resolved by the middleware.
- Using `supabase.auth.getSession()` on the server. Returns what's in memory, not a fresh server-validated session; always use `getUser()` (which validates the JWT).
- Storing user-specific data in cookies manually. Supabase handles session cookies; add a new row in your DB for everything else.

## Related skills

- `auth-seam` — why the cookieAdapter + authService.getUserFromRequest pattern exists
- `orpc-patterns` — how procedures consume `context.user`
