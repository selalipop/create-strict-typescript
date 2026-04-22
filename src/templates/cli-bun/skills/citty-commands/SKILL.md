---
name: citty-commands
description: Describes the citty command pattern used in this Bun CLI — defineCommand, subcommand tree, positional vs flag args, Bun-specific affordances like direct .ts execution and bun build --compile. Use when adding a command, shipping a binary, or debugging argv.
---

# citty commands (Bun)

This project's CLI uses [citty](https://github.com/unjs/citty) for argv parsing. Citty is runtime-agnostic — same API as the Node variant — but this project takes advantage of Bun's ability to run `.ts` directly.

## Entry point

`src/cli.ts`:

```ts
#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import { helloCommand } from "./commands/hello.ts";

const main = defineCommand({
  meta: {
    name: "my-cli",
    version: "0.0.0",
    description: "...",
  },
  subCommands: {
    hello: helloCommand,
  },
});

void runMain(main);
```

`void runMain(main)` — **keep the `void`**; the project's type-aware linter flags floating promises.

## Shipping a binary

Two modes:

- **Development / source-run**: `bun run src/cli.ts` — no build step, fastest iteration.
- **Production binary**: `bun run build:compile` — runs `bun build --compile --outfile dist/my-cli src/cli.ts` producing a single-file native executable (no Bun runtime needed on the target machine).

Cross-compile for other platforms:
```sh
bun build --compile --target=bun-linux-x64 src/cli.ts --outfile dist/my-cli-linux
bun build --compile --target=bun-darwin-arm64 src/cli.ts --outfile dist/my-cli-macos-arm64
```

## Bun-specific APIs to leverage

- **`Bun.file(path).text()`** — faster than `readFileSync` + `toString()`
- **`Bun.write(path, data)`** — atomic + fast
- **`Bun.argv`** — same as `process.argv` but Bun-native
- **`Bun.spawn({ cmd })`** — streaming stdio with better ergonomics than `child_process.spawn`
- **Top-level `await`** — works in the entry file since Bun's module is ESM

Don't use these in code that may also need to run under Node — citty commands should be runtime-agnostic unless you mark them as Bun-only.

## Arg types / subcommands

Same as the Node variant — `positional`, `string`, `boolean`, `number`, `enum`. See the citty docs linked above.

## Invariants

- The shebang is `#!/usr/bin/env bun` (not `node`). Users without Bun get a clear "command not found" instead of a syntax error.
- `bin` in `package.json` points at `src/cli.ts` (not `dist/...`) because Bun can execute `.ts` directly.
- **Don't commit the compiled binary in `dist/`.** Ship via npm (source) and let users compile locally, or publish binaries to GitHub Releases.

## Anti-patterns

- Running `bun build` without `--compile` for a CLI — produces a bundle, not an executable. Use `--compile` unless you specifically want a bundle.
- Using Node's `child_process` when `Bun.spawn` is right there.
- Leaving `npm run` script names in `package.json` assuming npm; always the `bun run`-aware variants.

## Related skills

- `lint-stack` — type-aware oxlint rules that catch floating promises (`typescript/no-floating-promises`)
