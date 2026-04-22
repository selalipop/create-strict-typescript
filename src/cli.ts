#!/usr/bin/env node
import { parseArgs } from "node:util";
import { intro, log, select } from "@clack/prompts";
import pc from "picocolors";
import { promptInitExtras, runInit } from "./modes/init.ts";
import { promptExtras, runScaffold } from "./modes/scaffold.ts";
import type { PackageManager } from "./templates/types.ts";
import { detectPackageManager } from "./util/detect.ts";

const VERSION = "0.3.0";

const HELP = `
  create-strict-typescript ${pc.dim(`v${VERSION}`)}
  ${pc.dim("Curated starter toolkit with a strict TypeScript baseline")}

  ${pc.bold("Usage")}
    ${pc.cyan("create-strict-typescript")} [dir] [options]
    ${pc.cyan("create-strict-typescript")} --init [options]

  ${pc.bold("Options")}
    --template <id>     Scaffold a specific template (lib, cli-node, cli-bun, tanstack)
    --init              Overlay strict baseline onto an existing project in the current dir
    --pm <pm>           Force package manager (npm | pnpm | yarn | bun)
    --yes, -y           Skip prompts, use sensible defaults
    --no-install        Don't run <pm> install after scaffolding
    --no-husky          Skip husky + lint-staged
    --no-knip           Skip knip
    --no-tsgolint       Skip type-aware oxlint backend
    --no-tsgo           Use tsc instead of tsgo for typecheck
    --help, -h          Show this help
    --version, -v       Show version
`;

interface ParsedArgs {
  dir: string | undefined;
  template: string | undefined;
  init: boolean;
  pm: string | undefined;
  yes: boolean;
  install: boolean;
  husky: boolean;
  knip: boolean;
  tsgolint: boolean;
  tsgo: boolean;
  help: boolean;
  version: boolean;
  promptOverrides: Record<string, string | boolean>;
}

const NEGATABLE = new Set(["install", "husky", "knip", "tsgolint", "tsgo"]);
const KNOWN_FLAGS = new Set([
  "template",
  "init",
  "pm",
  "yes",
  "y",
  "install",
  "husky",
  "knip",
  "tsgolint",
  "tsgo",
  "help",
  "h",
  "version",
  "v",
]);

function preprocessArgv(argv: string[]): {
  args: string[];
  overrides: Record<string, boolean>;
  promptOverrides: Record<string, string | boolean>;
} {
  const overrides: Record<string, boolean> = {};
  const promptOverrides: Record<string, string | boolean> = {};
  const filtered: string[] = [];
  for (const token of argv) {
    const noMatch = /^--no-([a-zA-Z-]+)$/.exec(token);
    if (noMatch && noMatch[1] !== undefined) {
      if (NEGATABLE.has(noMatch[1])) {
        overrides[noMatch[1]] = false;
      } else {
        promptOverrides[noMatch[1]] = false;
      }
      continue;
    }
    const kvMatch = /^--([a-zA-Z][a-zA-Z0-9-]*)=(.+)$/.exec(token);
    if (kvMatch && kvMatch[1] !== undefined && kvMatch[2] !== undefined) {
      if (!KNOWN_FLAGS.has(kvMatch[1])) {
        const value = kvMatch[2];
        promptOverrides[kvMatch[1]] = value === "true" ? true : value === "false" ? false : value;
        continue;
      }
    }
    filtered.push(token);
  }
  return { args: filtered, overrides, promptOverrides };
}

function parse(): ParsedArgs {
  const { args, overrides, promptOverrides } = preprocessArgv(process.argv.slice(2));
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      template: { type: "string" },
      init: { type: "boolean", default: false },
      pm: { type: "string" },
      yes: { type: "boolean", short: "y", default: false },
      install: { type: "boolean", default: true },
      husky: { type: "boolean", default: true },
      knip: { type: "boolean", default: true },
      tsgolint: { type: "boolean", default: true },
      tsgo: { type: "boolean", default: true },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
    },
    strict: true,
  });
  const bool = (key: keyof typeof overrides, fallback: boolean): boolean =>
    key in overrides ? (overrides[key] ?? fallback) : fallback;
  return {
    dir: positionals[0],
    template: values.template,
    init: values.init === true,
    pm: values.pm,
    yes: values.yes === true,
    install: bool("install", values.install !== false),
    husky: bool("husky", values.husky !== false),
    knip: bool("knip", values.knip !== false),
    tsgolint: bool("tsgolint", values.tsgolint !== false),
    tsgo: bool("tsgo", values.tsgo !== false),
    help: values.help === true,
    version: values.version === true,
    promptOverrides,
  };
}

async function resolvePackageManager(
  requested: string | undefined,
  cwd: string,
): Promise<PackageManager> {
  if (requested) {
    if (!["npm", "pnpm", "yarn", "bun"].includes(requested)) {
      throw new Error(`Unknown package manager: ${requested}`);
    }
    return requested as PackageManager;
  }
  const detected = await detectPackageManager(cwd);
  if (detected) {
    return detected;
  }
  const chosen = await select<PackageManager>({
    message: "Which package manager?",
    options: [
      { value: "pnpm", label: "pnpm" },
      { value: "bun", label: "bun" },
      { value: "npm", label: "npm" },
      { value: "yarn", label: "yarn" },
    ],
  });
  if (typeof chosen !== "string") {
    process.exit(0);
  }
  return chosen;
}

async function main(): Promise<void> {
  let args: ParsedArgs;
  try {
    args = parse();
  } catch (err) {
    console.error(pc.red((err as Error).message));
    console.error(HELP);
    process.exit(1);
  }

  if (args.help) {
    console.log(HELP);
    return;
  }
  if (args.version) {
    console.log(VERSION);
    return;
  }

  intro(`${pc.bgCyan(pc.black(" create-strict-typescript "))} ${pc.dim(`v${VERSION}`)}`);

  const cwd = process.cwd();
  const pm = await resolvePackageManager(args.pm, args.init ? cwd : cwd);

  if (args.init) {
    const extras = await promptInitExtras(args.yes, {
      husky: args.husky,
      knip: args.knip,
      tsgolint: args.tsgolint,
      tsgo: args.tsgo,
    });
    await runInit({
      targetDir: cwd,
      pm,
      yes: args.yes,
      install: args.install,
      ...extras,
    });
    return;
  }

  const extras = await promptExtras(args.yes, {
    husky: args.husky,
    knip: args.knip,
    tsgolint: args.tsgolint,
    tsgo: args.tsgo,
  });

  await runScaffold({
    projectDir: args.dir,
    templateId: args.template,
    pm,
    yes: args.yes,
    install: args.install,
    promptOverrides: args.promptOverrides,
    ...extras,
  });
}

main().catch((err) => {
  log.error(pc.red(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
