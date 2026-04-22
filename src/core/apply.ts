import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse, stringify } from "comment-json";
import pc from "picocolors";
import type { PackageManager } from "../templates/types.ts";
import { STRICT_COMPILER_OPTIONS } from "./strict-tsconfig.ts";

export interface CoreOptions {
  pm: PackageManager;
  husky: boolean;
  knip: boolean;
  tsgolint: boolean;
  tsgo: boolean;
  reactPlugin: boolean;
}

export interface ApplyResult {
  changes: string[];
  warnings: string[];
}

export async function applyCoreBaseline(
  projectDir: string,
  opts: CoreOptions,
): Promise<ApplyResult> {
  const result: ApplyResult = { changes: [], warnings: [] };

  mergeStrictTsconfig(projectDir, result);
  writeIfAbsent(projectDir, "biome.json", renderBiomeConfig(), result);
  writeIfAbsent(projectDir, ".oxlintrc.json", renderOxlintConfig(opts.reactPlugin), result);
  if (opts.knip) {
    writeIfAbsent(projectDir, "knip.json", renderKnipConfig(), result);
  }
  writeIfAbsent(projectDir, ".vscode/settings.json", renderVscodeSettings(), result);
  if (opts.husky) {
    writeHuskyHook(projectDir, opts.pm, result);
  }
  mergePackageJson(projectDir, opts, result);

  return result;
}

function mergeStrictTsconfig(projectDir: string, result: ApplyResult): void {
  const tsconfigPath = join(projectDir, "tsconfig.json");
  if (!existsSync(tsconfigPath)) {
    const fresh = {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        lib: ["ES2022"],
        ...STRICT_COMPILER_OPTIONS,
        noEmit: true,
        types: ["node"],
      },
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["node_modules", "dist"],
    };
    writeFileSync(tsconfigPath, `${JSON.stringify(fresh, null, 2)}\n`);
    result.changes.push("created tsconfig.json");
    return;
  }

  const raw = readFileSync(tsconfigPath, "utf8");
  const parsed = parse(raw) as { compilerOptions?: Record<string, unknown> } | null;
  if (!parsed || typeof parsed !== "object") {
    result.warnings.push("tsconfig.json is not a valid object — skipping merge");
    return;
  }
  if (parsed.compilerOptions === undefined) {
    parsed.compilerOptions = {};
  }
  const co = parsed.compilerOptions;
  let touched = 0;
  for (const [key, value] of Object.entries(STRICT_COMPILER_OPTIONS)) {
    const existing = co[key];
    if (existing !== value) {
      if (existing !== undefined && existing !== value) {
        result.warnings.push(`tsconfig.json ${key}: ${String(existing)} → ${String(value)}`);
      }
      co[key] = value;
      touched++;
    }
  }
  if (touched === 0) {
    return;
  }
  writeFileSync(tsconfigPath, `${stringify(parsed, null, 2)}\n`);
  result.changes.push(
    `merged ${touched} strict flag${touched === 1 ? "" : "s"} into tsconfig.json`,
  );
}

function writeIfAbsent(
  projectDir: string,
  relPath: string,
  content: string,
  result: ApplyResult,
): void {
  const target = join(projectDir, relPath);
  if (existsSync(target)) {
    result.warnings.push(`${relPath} already exists — skipped`);
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
  result.changes.push(`wrote ${relPath}`);
}

function writeHuskyHook(projectDir: string, pm: PackageManager, result: ApplyResult): void {
  const huskyDir = join(projectDir, ".husky");
  const hookPath = join(huskyDir, "pre-commit");
  if (existsSync(hookPath)) {
    result.warnings.push(".husky/pre-commit already exists — skipped");
    return;
  }
  mkdirSync(huskyDir, { recursive: true });
  const exec = pm === "bun" ? "bun exec" : pm === "yarn" ? "yarn" : `${pm} exec`;
  writeFileSync(hookPath, `${exec} lint-staged\n`, { mode: 0o755 });
  result.changes.push("wrote .husky/pre-commit");
}

function mergePackageJson(projectDir: string, opts: CoreOptions, result: ApplyResult): void {
  const pkgPath = join(projectDir, "package.json");
  if (!existsSync(pkgPath)) {
    result.warnings.push("no package.json found — cannot merge scripts/deps");
    return;
  }
  const raw = readFileSync(pkgPath, "utf8");
  const pkg = parse(raw) as Record<string, unknown>;

  pkg.type ??= "module";

  const scripts = ((pkg.scripts as Record<string, string> | undefined) ?? {}) as Record<
    string,
    string
  >;
  const oxFlags = [
    "--disable-unicorn-plugin",
    ...(opts.reactPlugin ? ["--react-plugin"] : []),
    ...(opts.tsgolint ? ["--type-aware", "--type-check"] : []),
  ].join(" ");

  const runCmd = (s: string): string => {
    switch (opts.pm) {
      case "npm":
        return `npm run ${s}`;
      case "pnpm":
        return `pnpm ${s}`;
      case "yarn":
        return `yarn ${s}`;
      case "bun":
        return `bun run ${s}`;
    }
  };

  const coreScripts: Record<string, string> = {
    typecheck: opts.tsgo ? "tsgo --project tsconfig.json --noEmit" : "tsc --noEmit",
    "lint:biome": "biome check .",
    "lint:oxc": `oxlint . ${oxFlags} --max-warnings=0`,
    lint: `${runCmd("lint:biome")} && ${runCmd("lint:oxc")} && ${runCmd("typecheck")}`,
    fix: `biome check --write . && oxlint . ${oxFlags} --fix`,
    fixunsafe: `biome check --write --unsafe . && oxlint . ${oxFlags} --fix --fix-suggestions --fix-dangerously`,
  };
  if (opts.knip) {
    coreScripts.knip = "knip";
  }
  if (opts.husky) {
    coreScripts.prepare = "husky";
  }
  let scriptsAdded = 0;
  for (const [name, cmd] of Object.entries(coreScripts)) {
    if (scripts[name] === undefined) {
      scripts[name] = cmd;
      scriptsAdded++;
    } else if (scripts[name] !== cmd) {
      result.warnings.push(`script "${name}" already defined — left as-is`);
    }
  }
  pkg.scripts = scripts;

  const devDeps = ((pkg.devDependencies as Record<string, string> | undefined) ?? {}) as Record<
    string,
    string
  >;
  const coreDevDeps: Record<string, string> = {
    "@biomejs/biome": "^2.4.12",
    oxlint: "^1.61.0",
    typescript: "^5.9.3",
    "@types/node": "^22.10.0",
  };
  if (opts.husky) {
    coreDevDeps.husky = "^9.1.7";
    coreDevDeps["lint-staged"] = "^16.2.7";
  }
  if (opts.knip) {
    coreDevDeps.knip = "^5.73.4";
  }
  if (opts.tsgolint) {
    coreDevDeps["oxlint-tsgolint"] = "^0.21.1";
  }
  if (opts.tsgo) {
    coreDevDeps["@typescript/native-preview"] = "^7.0.0-dev.20260218.1";
  }
  let depsAdded = 0;
  for (const [name, version] of Object.entries(coreDevDeps)) {
    if (!(name in devDeps)) {
      devDeps[name] = version;
      depsAdded++;
    }
  }
  pkg.devDependencies = devDeps;

  if (opts.husky && pkg["lint-staged"] === undefined) {
    pkg["lint-staged"] = {
      "*.{ts,tsx,js,jsx}": ["biome check --write", `oxlint ${oxFlags} --fix`],
    };
    result.changes.push("added lint-staged config");
  }

  if (opts.pm === "pnpm" && pkg.packageManager === undefined) {
    pkg.packageManager = "pnpm@10.28.0";
  }
  if (opts.pm === "yarn" && pkg.packageManager === undefined) {
    pkg.packageManager = "yarn@4.4.1";
  }

  writeFileSync(pkgPath, `${stringify(pkg, null, 2)}\n`);
  if (scriptsAdded > 0) {
    result.changes.push(`added ${scriptsAdded} script${scriptsAdded === 1 ? "" : "s"}`);
  }
  if (depsAdded > 0) {
    result.changes.push(`added ${depsAdded} devDep${depsAdded === 1 ? "" : "s"}`);
  }
}

export function colorize(result: ApplyResult): string {
  const lines: string[] = [];
  for (const change of result.changes) {
    lines.push(`  ${pc.green("+")} ${change}`);
  }
  for (const warning of result.warnings) {
    lines.push(`  ${pc.yellow("!")} ${warning}`);
  }
  return lines.join("\n");
}

function renderBiomeConfig(): string {
  const config = {
    $schema: "https://biomejs.dev/schemas/2.4.12/schema.json",
    formatter: {
      enabled: true,
      indentStyle: "space",
      indentWidth: 2,
      lineWidth: 100,
    },
    linter: {
      enabled: true,
      rules: {
        recommended: true,
        style: { useBlockStatements: "error" },
      },
    },
    assist: { actions: { source: { organizeImports: "on" } } },
    files: {
      includes: [
        "**",
        "!**/node_modules",
        "!**/dist",
        "!**/build",
        "!**/coverage",
        "!**/.next",
        "!**/.output",
        "!**/.vinxi",
        "!**/*.gen.ts",
      ],
    },
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}

function renderOxlintConfig(reactPlugin: boolean): string {
  const rules: Record<string, unknown> = {
    "typescript/no-explicit-any": "error",
    "typescript/restrict-plus-operands": "error",
    "typescript/no-unnecessary-condition": "error",
    "typescript/restrict-template-expressions": [
      "error",
      { allowNumber: true, allowBoolean: true },
    ],
    "eslint/no-unused-vars": [
      "error",
      {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
  };
  if (reactPlugin) {
    rules["react/rules-of-hooks"] = "error";
    rules["react/exhaustive-deps"] = "error";
  }
  const config: Record<string, unknown> = {
    $schema: "./node_modules/oxlint/configuration_schema.json",
    env: { browser: true, es2022: true, node: true },
    ignorePatterns: ["node_modules/**", "dist/**", "build/**", "coverage/**", "**/*.gen.ts"],
    rules,
  };
  if (reactPlugin) {
    config.settings = { react: { version: "19.0.0" } };
  }
  return `${JSON.stringify(config, null, 2)}\n`;
}

function renderKnipConfig(): string {
  const config = {
    $schema: "https://unpkg.com/knip@5/schema.json",
    ignoreExportsUsedInFile: {
      interface: true,
      type: true,
    },
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}

function renderVscodeSettings(): string {
  const config = {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.biome": "explicit",
      "source.organizeImports.biome": "explicit",
    },
    "[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
    "[typescriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
    "[javascript]": { "editor.defaultFormatter": "biomejs.biome" },
    "[javascriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
    "[json]": { "editor.defaultFormatter": "biomejs.biome" },
    "[jsonc]": { "editor.defaultFormatter": "biomejs.biome" },
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}
