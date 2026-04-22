# create-strict-typescript

Curated starter toolkit with a strict TypeScript baseline (Biome + Oxlint + tsgo), plus opinionated templates for full-stack apps, CLIs, and libraries.

## Quick start

```sh
pnpm create strict-typescript my-app
bun  create strict-typescript my-app
npm  create strict-typescript my-app
```

Pick a template interactively, or name one up-front:

```sh
pnpm create strict-typescript my-app --template tanstack
pnpm create strict-typescript my-cli --template cli-bun
pnpm create strict-typescript my-lib --template lib
```

Got an existing project you want to retrofit with the same baseline? Run init mode from inside it:

```sh
cd existing-project
pnpm create strict-typescript --init
```

## What's in the baseline

Every template — and init mode — layers on:

- **[Biome](https://biomejs.dev)** — formatter + linter + import sorting, one tool
- **[Oxlint](https://oxc.rs/docs/guide/usage/linter.html)** — the fast Rust linter, with type-aware rules via the `oxlint-tsgolint` backend
- **[tsgo](https://github.com/microsoft/typescript-go)** — Go-native TypeScript compiler (preview) for fast typechecking
- **[Knip](https://knip.dev)** — dead code + unused export detection
- **[husky](https://typicode.github.io/husky/)** + **[lint-staged](https://github.com/lint-staged/lint-staged)** — pre-commit hook that runs Biome + Oxlint on staged files
- Strict `tsconfig.json` flags — `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`, plus every `strict: true` flag

Full set of compiler options added:

```jsonc
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "useUnknownInCatchVariables": true,
  "noImplicitOverride": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "forceConsistentCasingInFileNames": true,
  "isolatedModules": true,
  "skipLibCheck": true,
  "esModuleInterop": true,
  "resolveJsonModule": true,
  "allowJs": true
}
```

Framework-specific settings (`jsx`, `lib`, `moduleResolution`, `paths`, `target`, `module`, `types`) are preserved when they already exist — only the strict-level flags are layered on.

## Templates

### `tanstack` — full-stack TanStack Start + oRPC

Scaffold-time prompts:

| Prompt     | Options                                       |
|------------|-----------------------------------------------|
| Auth       | `none` / `placeholder` (default) / `supabase` |
| UI library | `none` / `DaisyUI` / `HeroUI v3`              |
| Database   | `none` / `Drizzle + SQLite`                   |
| Capacitor  | `no` (default) / `yes`                        |

- Includes a working `/` route that fetches via oRPC + React Query
- oRPC handler mounted at `/api/v1/rpc/$`
- `placeholder` auth ships the full oRPC auth shape with an `authService` stub — swap the stub for real auth in one file
- `supabase` fills the stub with a working `@supabase/ssr` cookie-adapter flow + `/api/v1/auth/callback`
- Capacitor adds `capacitor.config.ts`, build scripts, and a `MOBILE.md` note about running `cap add ios` / `cap add android` yourself

### `cli-node` — publishable Node CLI

- [citty](https://github.com/unjs/citty) for argv parsing + subcommands
- [tsdown](https://tsdown.dev) for fast ESM builds
- Sample `hello` command
- `bin` field pre-wired

### `cli-bun` — Bun CLI

- Runs `.ts` directly, no build step for dev
- `build:compile` produces a single-file native binary via `bun build --compile`
- `citty` (runtime-agnostic) for commands
- Uses `Bun.version` etc. where it makes a meaningful difference

### `lib` — minimal TypeScript library

- `type: module`, `exports` map, `files` field
- Optional `tsdown` build with `dts: true` (default on)
- No framework coupling

### `init` — overlay on an existing project

Runs in the current directory:

- Merges strict flags into your existing `tsconfig.json` (never overwrites `jsx` / `lib` / `moduleResolution` / `paths`)
- Creates `biome.json`, `.oxlintrc.json`, `knip.json`, `.vscode/settings.json`, `.husky/pre-commit` if they don't exist
- Merges core scripts + devDeps into `package.json` (never overwrites existing scripts)
- Auto-enables Oxlint's React rules if React is detected in deps
- Idempotent — second run is a no-op

## CLI options

```
pnpm create strict-typescript [dir] [options]

  --template <id>     lib | cli-node | cli-bun | tanstack
  --init              Overlay baseline onto cwd instead of scaffolding a new project
  --pm <pm>           Force package manager (npm | pnpm | yarn | bun)
  --yes, -y           Skip prompts, use defaults
  --no-install        Don't run <pm> install after scaffolding
  --no-husky          Skip husky + lint-staged
  --no-knip           Skip knip
  --no-tsgolint       Skip type-aware oxlint backend (alpha)
  --no-tsgo           Use tsc instead of tsgo for typecheck
  --version, -v       Print version
  --help, -h          Print help
```

## Extending

Templates live in `src/templates/<id>/` — each one is a folder with a `template.ts` describing prompts + feature overlays, plus a `files/` directory of verbatim-copied files and (optionally) a `features/<feature-name>/` directory per overlay.

Add a template:

1. Create `src/templates/your-template/{template.ts, files/, features/*}`
2. Register it in `src/templates/registry.ts`
3. That's it — the CLI core never touches framework-specifics.

## Under the hood

- Prompts: **[@clack/prompts](https://clack.cc)** (v1.2 — used by `create-vite`, `create-astro`, `create-t3-app`)
- Colors: **picocolors** (~400 bytes, ~8M ops/sec)
- Spinners: clack's built-in `tasks()` runner
- PM detection: **[package-manager-detector](https://github.com/antfu-collective/package-manager-detector)**
- `tsconfig.json` merging: **comment-json** (preserves comments + trailing commas)
- Everything bundled with **tsdown** (zero-config, ESM-first)

## License

MIT
