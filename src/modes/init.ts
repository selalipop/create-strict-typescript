import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { confirm, isCancel, log, multiselect, note, outro, tasks } from "@clack/prompts";
import pc from "picocolors";
import { applyCoreBaseline, colorize } from "../core/apply.ts";
import type { PackageManager } from "../templates/types.ts";
import { generateAgentsMd } from "../util/agents-md.ts";
import { inspectHostProject } from "../util/detect.ts";
import { runBiomeFormat, runInstall } from "../util/install.ts";

export interface InitOptions {
  targetDir: string;
  pm: PackageManager;
  yes: boolean;
  install: boolean;
  husky: boolean;
  knip: boolean;
  tsgolint: boolean;
  tsgo: boolean;
}

export async function runInit(opts: InitOptions): Promise<void> {
  const dir = resolve(opts.targetDir);
  if (!existsSync(join(dir, "package.json"))) {
    log.error(
      `${pc.red("No package.json found in")} ${pc.cyan(dir)}. Run "${opts.pm} init" first, or use scaffold mode.`,
    );
    process.exit(1);
  }

  const host = inspectHostProject(dir);
  if (host.hasReact) {
    log.info(
      `${pc.dim("detected")} ${pc.cyan("React")}${host.hasNext ? " + Next.js" : ""}${host.hasVite ? " + Vite" : ""}`,
    );
  }

  if (!opts.yes) {
    const confirmed = await confirm({
      message: `Layer strict baseline onto ${pc.cyan(dir)}?`,
      initialValue: true,
    });
    if (isCancel(confirmed) || !confirmed) {
      log.info("cancelled");
      process.exit(0);
    }
  }

  await tasks([
    {
      title: "Apply strict baseline",
      task: async () => {
        const result = await applyCoreBaseline(dir, {
          pm: opts.pm,
          husky: opts.husky,
          knip: opts.knip,
          tsgolint: opts.tsgolint,
          tsgo: opts.tsgo,
          reactPlugin: host.hasReact,
        });
        const diff = colorize(result);
        if (diff) {
          note(diff, "changes");
        }
        return "baseline layered";
      },
    },
    {
      title: "Generate AGENTS.md + CLAUDE.md",
      task: async () => {
        const pkgPath = join(dir, "package.json");
        let projectName = "project";
        if (existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { name?: string };
            if (pkg.name) {
              projectName = pkg.name;
            }
          } catch {
            // ignore
          }
        }
        generateAgentsMd(dir, {
          projectName,
          templateId: "init",
          packageManager: opts.pm,
        });
        return "agent guidance written";
      },
    },
    ...(opts.install
      ? [
          {
            title: `Install new devDeps (${opts.pm} install)`,
            task: async () => {
              await runInstall(opts.pm, dir);
              return "deps installed";
            },
          },
          {
            title: "Format generated files",
            task: async () => {
              try {
                await runBiomeFormat(opts.pm, dir);
                return "formatted";
              } catch {
                return "format skipped";
              }
            },
          },
        ]
      : []),
  ]);

  outro(pc.green("strict baseline applied ✓"));
}

export async function promptInitExtras(
  yes: boolean,
  defaults: { husky: boolean; knip: boolean; tsgolint: boolean; tsgo: boolean },
): Promise<{ husky: boolean; knip: boolean; tsgolint: boolean; tsgo: boolean }> {
  if (yes) {
    return defaults;
  }
  const result = await multiselect({
    message: "Extras (space to toggle, enter to confirm)",
    options: [
      { value: "husky", label: "husky + lint-staged pre-commit" },
      { value: "knip", label: "knip — dead code detection" },
      { value: "tsgolint", label: "oxlint-tsgolint — type-aware rules", hint: "alpha" },
      { value: "tsgo", label: "tsgo — Go-native TS compiler", hint: "preview" },
    ],
    initialValues: Object.entries(defaults)
      .filter(([, v]) => v)
      .map(([k]) => k),
    required: false,
  });
  if (isCancel(result)) {
    process.exit(0);
  }
  const set = new Set(result as string[]);
  return {
    husky: set.has("husky"),
    knip: set.has("knip"),
    tsgolint: set.has("tsgolint"),
    tsgo: set.has("tsgo"),
  };
}
