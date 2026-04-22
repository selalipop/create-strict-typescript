# {{name}}

A Bun CLI — runs TypeScript directly, compiles to a single-file binary with `bun build --compile`.

## Scripts

- `bun run start` — run directly from source (`src/cli.ts`)
- `bun run build` — bundle to `dist/` for distribution
- `bun run build:compile` — produce a single-file native executable at `dist/{{name}}`
- `bun run lint` — Biome + Oxlint + typecheck
- `bun run fix` — auto-fix lint issues

## Run locally

```sh
bun run src/cli.ts hello
bun run src/cli.ts hello there
```
