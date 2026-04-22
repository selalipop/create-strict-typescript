---
name: lib-publishing
description: Describes how this TypeScript library is structured for publishing — exports field, files whitelist, tsdown build with dts, and the npm pack --dry-run checklist before a release. Use when preparing a release, changing the package's public surface, or debugging a consumer who can't import a symbol.
---

# Library publishing

This project is a publishable TypeScript library. The shape below is what makes consumers (Node, Bun, Vite, Next.js) all resolve the package correctly.

## package.json shape

```jsonc
{
  "name": "my-lib",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"]
}
```

### Field breakdown

- **`type: "module"`** — ESM-first. CommonJS consumers get the ESM via `require(esm)` in Node 22+, or a build tool interop.
- **`exports`** — the **only** public surface. Everything not listed here is private. Consumers can't `import { thing } from "my-lib/internal/thing"` unless you add a subpath.
- **`types`** MUST come before `default` in each condition. TypeScript resolves conditions in order.
- **`files`** — whitelist of what gets included in the published tarball. Only `dist/` — don't ship source unless intentional.

## Adding a subpath export

```jsonc
"exports": {
  ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
  "./utils": { "types": "./dist/utils.d.ts", "default": "./dist/utils.js" }
}
```

Then `import { x } from "my-lib/utils"` works. Add a corresponding entry to `tsdown.config.ts`:
```ts
entry: ["src/index.ts", "src/utils.ts"]
```

## Build

`tsdown` builds ESM with type declarations:
```ts
// tsdown.config.ts
import { defineConfig } from "tsdown";
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
});
```

`pnpm build` → `dist/index.js` + `dist/index.d.ts`.

## Pre-publish checklist

1. `pnpm lint` — biome + oxlint + tsgo all green
2. `pnpm build` — produces `dist/`
3. `npm pack --dry-run` — inspect the tarball contents. Verify:
   - Only `dist/`, `package.json`, `README.md`, `LICENSE`
   - No source (`src/`), no tests, no config
   - Size looks right (typical small lib: under 50 KB)
4. Bump `version` in `package.json`
5. `npm publish` (needs npm login + 2FA OTP if configured)
6. Tag the commit: `git tag v0.1.0 && git push origin v0.1.0`

## Common failure modes

- **`Cannot find module 'my-lib'`** on a consumer → `exports.`.`default` path wrong, or the file isn't in `files` / tarball.
- **`No matching export`** at an unexpected path → you forgot to add a subpath to `exports` but the file exists in `dist/`.
- **`Types not recognized`** → `types` condition missing, or it's ordered after `default` / `import` conditions.
- **Tarball includes too much** → `files` too loose; prefer a whitelist over `.npmignore`.

## Anti-patterns

- Shipping `src/` unless you intentionally want source maps or re-publishing. It bloats the tarball and leaks internal file paths.
- Manually editing `dist/` files. They're rebuilt on every publish.
- Dropping `types` from `exports` "because TypeScript finds the .d.ts anyway" — some resolvers don't and you'll regret it.
- Publishing without `npm pack --dry-run` — you will eventually ship a secret in a test fixture or a stale `dist/`.

## Related skills

- `lint-stack` — what `pnpm lint` runs
- `strict-typescript` — the flags that make the generated `.d.ts` strict
