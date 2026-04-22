---
name: citty-commands
description: Describes the citty command pattern used in this project — defineCommand, subcommand tree, positional vs flag args, shared meta/context. Use when adding a new command, refactoring args, or debugging how argv is parsed.
---

# citty commands

This project's CLI uses [citty](https://github.com/unjs/citty) for argv parsing and subcommand composition. Citty is a small, typed alternative to commander / yargs.

## Entry point

`src/cli.ts` defines the root command and composes subcommands:

```ts
#!/usr/bin/env node
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

`runMain` returns a `Promise` — **always prefix with `void`** (the project's type-aware linter flags floating promises).

## Adding a subcommand

```ts
// src/commands/build.ts
import { defineCommand } from "citty";

export const buildCommand = defineCommand({
  meta: {
    name: "build",
    description: "Build the thing",
  },
  args: {
    input: {
      type: "positional",
      description: "Path to input",
      required: true,
    },
    watch: {
      type: "boolean",
      description: "Rebuild on change",
      default: false,
    },
    outDir: {
      type: "string",
      description: "Output directory",
      default: "dist",
    },
  },
  async run({ args }) {
    // args.input: string
    // args.watch: boolean
    // args.outDir: string
  },
});
```

Register in `src/cli.ts`:
```ts
subCommands: {
  hello: helloCommand,
  build: buildCommand,
}
```

## Arg types

- `positional` — order-dependent; `required: true` means it must be supplied (`my-cli build ./src`)
- `string` / `boolean` / `number` / `enum` — flag args (`--out-dir=./dist`)
- `enum`: `{ type: "enum", options: ["debug", "info", "warn"], default: "info" }`

## Patterns

- **Nested subcommands**: add another `subCommands:` inside a command for deeper trees (`my-cli db push`, `my-cli db migrate`).
- **Shared setup** (config load, log level): wrap the handler, or use a `setup` hook if citty's newer API is present in your version.
- **Exit codes**: citty exits 0 on success, 1 on uncaught error. For custom codes, call `process.exit(code)` yourself.
- **Logging**: prefer `picocolors` (already a dep in scaffolder CLIs we generate) + `@clack/prompts` for rich output; keep the hot path dep-free for cold start time.

## Anti-patterns

- Writing `runMain(main)` without `void` — the linter will fail (`typescript/no-floating-promises`).
- Parsing argv manually for one flag "just because it's simpler" — mixing manual parsing with citty leaves a subset of inputs unhandled (`--help`, `--version`).
- Calling async work at module-load time. Put it inside `run()` so help / version commands stay fast.
- Forgetting the shebang (`#!/usr/bin/env node` or `#!/usr/bin/env bun` for the bun variant). Without it, the bin isn't invocable.

## Related skills

- `lint-stack` — the type-aware oxlint rule flagging floating promises is `typescript/no-floating-promises`
