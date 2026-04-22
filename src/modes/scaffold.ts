import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join, relative } from "node:path";
import {
  cancel,
  confirm,
  group,
  isCancel,
  log,
  multiselect,
  note,
  outro,
  select,
  tasks,
  text,
} from "@clack/prompts";
import pc from "picocolors";
import { applyCoreBaseline, colorize } from "../core/apply.ts";
import { getTemplate, templates } from "../templates/registry.ts";
import type { PackageManager, Template, TemplatePrompt } from "../templates/types.ts";
import { generateAgentsMd } from "../util/agents-md.ts";
import { runBiomeFormat, runInstall, runTsrGenerate } from "../util/install.ts";
import { featureSkillsDir, templateSkillsDir } from "../util/paths.ts";
import { renderTemplate, sanitizePackageName } from "../util/tpl.ts";

export interface ScaffoldOptions {
  projectDir: string | undefined;
  templateId: string | undefined;
  pm: PackageManager;
  yes: boolean;
  install: boolean;
  husky: boolean;
  knip: boolean;
  tsgolint: boolean;
  tsgo: boolean;
}

export async function runScaffold(opts: ScaffoldOptions): Promise<void> {
  const projectName = await resolveProjectName(opts.projectDir, opts.yes);
  const absoluteDir = absolutePath(projectName);
  assertFreshTarget(absoluteDir);

  const template = await resolveTemplate(opts.templateId, opts.yes);
  const flags = await collectPromptAnswers(template, opts.yes);

  log.info(`${pc.dim("using")} ${pc.cyan(opts.pm)}`);

  await tasks([
    {
      title: `Copy ${template.id} template`,
      task: async () => {
        const pkgName = sanitizePackageName(basename(absoluteDir));
        copyTemplateFiles(template, absoluteDir, {
          name: pkgName,
          pm: opts.pm,
        });
        applyFeatureOverlays(template, flags, absoluteDir, {
          name: pkgName,
          pm: opts.pm,
        });
        copyTemplateAndFeatureSkills(template, flags, absoluteDir);
        return `${template.id} template copied`;
      },
    },
    {
      title: "Apply strict baseline",
      task: async () => {
        const ctx = await applyCoreBaseline(absoluteDir, {
          pm: opts.pm,
          husky: opts.husky,
          knip: opts.knip,
          tsgolint: opts.tsgolint,
          tsgo: opts.tsgo,
          reactPlugin: template.wantsReact ?? false,
        });
        const diff = colorize(ctx);
        if (diff) {
          note(diff, "baseline applied");
        }
        return "baseline ready";
      },
    },
    ...(template.postScaffold
      ? [
          {
            title: `Post-scaffold for ${template.id}`,
            task: async () => {
              await template.postScaffold?.({
                projectDir: absoluteDir,
                projectName,
                pm: opts.pm,
                flags,
                templateDir: template.baseFilesDir,
              });
              return "template finalized";
            },
          },
        ]
      : []),
    {
      title: "Generate AGENTS.md + CLAUDE.md",
      task: async () => {
        generateAgentsMd(absoluteDir, {
          projectName: sanitizePackageName(basename(absoluteDir)),
          templateId: template.id,
          packageManager: opts.pm,
        });
        return "agent guidance written";
      },
    },
    ...(opts.install
      ? [
          {
            title: `Install dependencies (${opts.pm} install)`,
            task: async () => {
              await runInstall(opts.pm, absoluteDir);
              return "dependencies installed";
            },
          },
          {
            title: "Generate route tree",
            task: async () => {
              const ran = await runTsrGenerate(absoluteDir);
              return ran ? "routes generated" : "no route generator";
            },
          },
          {
            title: "Format generated files",
            task: async () => {
              try {
                await runBiomeFormat(opts.pm, absoluteDir);
                return "formatted";
              } catch {
                return "format skipped";
              }
            },
          },
        ]
      : []),
  ]);

  const relDir = relative(process.cwd(), absoluteDir) || ".";
  const nextSteps = [
    relDir !== "." ? `cd ${relDir}` : undefined,
    !opts.install ? `${opts.pm} install` : undefined,
    `${runWord(opts.pm)} lint`,
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
  note(nextSteps, "next steps");
  outro(pc.green("all set ✓"));
}

export async function promptExtras(
  yes: boolean,
  defaults: { husky: boolean; knip: boolean; tsgolint: boolean; tsgo: boolean },
): Promise<{ husky: boolean; knip: boolean; tsgolint: boolean; tsgo: boolean }> {
  if (yes) {
    return defaults;
  }
  const result = await multiselect({
    message: "Extras (space to toggle, enter to confirm)",
    options: [
      {
        value: "husky",
        label: "husky + lint-staged pre-commit",
      },
      { value: "knip", label: "knip — dead code detection" },
      {
        value: "tsgolint",
        label: "oxlint-tsgolint — type-aware rules",
        hint: "alpha",
      },
      {
        value: "tsgo",
        label: "tsgo — Go-native TS compiler",
        hint: "preview",
      },
    ],
    initialValues: Object.entries(defaults)
      .filter(([, v]) => v)
      .map(([k]) => k),
    required: false,
  });
  if (isCancel(result)) {
    cancel("Setup cancelled — no files written.");
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

async function resolveProjectName(provided: string | undefined, yes: boolean): Promise<string> {
  if (provided) {
    return provided;
  }
  if (yes) {
    return "my-app";
  }
  const result = await text({
    message: "Project name",
    placeholder: "my-app",
    defaultValue: "my-app",
    validate: (value) => {
      if (!value) {
        return undefined;
      }
      const sanitized = sanitizePackageName(value);
      if (!sanitized) {
        return "Project name must contain alphanumeric characters";
      }
      return undefined;
    },
  });
  if (isCancel(result)) {
    cancel("Setup cancelled — no files written.");
    process.exit(0);
  }
  return result as string;
}

async function resolveTemplate(templateId: string | undefined, yes: boolean): Promise<Template> {
  if (templateId) {
    const tpl = getTemplate(templateId);
    if (!tpl) {
      throw new Error(
        `Unknown template: ${templateId}. Available: ${templates.map((t) => t.id).join(", ")}`,
      );
    }
    return tpl;
  }
  if (yes) {
    const fallback = templates[0];
    if (!fallback) {
      throw new Error("No templates registered");
    }
    return fallback;
  }
  const result = await select({
    message: "Pick a starter",
    options: templates.map((t) => ({
      value: t.id,
      label: t.label,
      hint: t.description,
    })),
  });
  if (isCancel(result)) {
    cancel("Setup cancelled — no files written.");
    process.exit(0);
  }
  const chosen = getTemplate(result as string);
  if (!chosen) {
    throw new Error(`Unknown template selection: ${String(result)}`);
  }
  return chosen;
}

async function collectPromptAnswers(
  template: Template,
  yes: boolean,
): Promise<Record<string, unknown>> {
  if (!template.prompts || template.prompts.length === 0) {
    return {};
  }
  if (yes) {
    const result: Record<string, unknown> = {};
    for (const p of template.prompts) {
      result[p.key] = p.initialValue ?? defaultAnswer(p);
    }
    return result;
  }
  const steps: Record<string, () => Promise<unknown>> = {};
  for (const prompt of template.prompts) {
    steps[prompt.key] = () => runPrompt(prompt);
  }
  const answers = await group(steps, {
    onCancel: () => {
      cancel("Setup cancelled — no files written.");
      process.exit(0);
    },
  });
  return answers;
}

function defaultAnswer(p: TemplatePrompt): unknown {
  if (p.kind === "confirm") {
    return false;
  }
  if (p.kind === "multiselect") {
    return [];
  }
  return p.options?.[0]?.value;
}

async function runPrompt(prompt: TemplatePrompt): Promise<unknown> {
  if (prompt.kind === "confirm") {
    return confirm({
      message: prompt.message,
      initialValue: (prompt.initialValue as boolean | undefined) ?? false,
    });
  }
  if (prompt.kind === "select") {
    return select({
      message: prompt.message,
      options: (prompt.options ?? []).map((o) => {
        const base: { value: string; label: string; hint?: string } = {
          value: o.value,
          label: o.label,
        };
        if (o.hint !== undefined) {
          base.hint = o.hint;
        }
        return base;
      }),
      initialValue: prompt.initialValue as string | undefined,
    });
  }
  return multiselect({
    message: prompt.message,
    options: (prompt.options ?? []).map((o) => {
      const base: { value: string; label: string; hint?: string } = {
        value: o.value,
        label: o.label,
      };
      if (o.hint !== undefined) {
        base.hint = o.hint;
      }
      return base;
    }),
    required: false,
    initialValues: (prompt.initialValue as string[] | undefined) ?? [],
  });
}

function copyTemplateFiles(
  template: Template,
  projectDir: string,
  vars: { name: string; pm: PackageManager },
): void {
  mkdirSync(projectDir, { recursive: true });
  cpSync(template.baseFilesDir, projectDir, { recursive: true });
  postCopy(projectDir, vars);
}

function applyFeatureOverlays(
  template: Template,
  flags: Record<string, unknown>,
  projectDir: string,
  vars: { name: string; pm: PackageManager },
): void {
  if (!template.featureDirs) {
    return;
  }
  for (const [flagKey, flagValue] of Object.entries(flags)) {
    const values = Array.isArray(flagValue) ? flagValue.map(String) : [String(flagValue)];
    for (const v of values) {
      const lookupKey = `${flagKey}:${v}`;
      const overlayPath = template.featureDirs[lookupKey] ?? template.featureDirs[v];
      if (!overlayPath) {
        continue;
      }
      cpSync(overlayPath, projectDir, { recursive: true, force: true });
    }
  }
  postCopy(projectDir, vars);
}

function copyTemplateAndFeatureSkills(
  template: Template,
  flags: Record<string, unknown>,
  projectDir: string,
): void {
  const skillsTarget = join(projectDir, ".claude", "skills");
  const templateSkills = templateSkillsDir(template.id);
  if (existsSync(templateSkills)) {
    mkdirSync(skillsTarget, { recursive: true });
    cpSync(templateSkills, skillsTarget, { recursive: true, force: true });
  }
  for (const [flagKey, flagValue] of Object.entries(flags)) {
    const values = Array.isArray(flagValue) ? flagValue.map(String) : [String(flagValue)];
    for (const v of values) {
      const lookupKey = `${flagKey}:${v}`;
      const overlayPath = template.featureDirs?.[lookupKey] ?? template.featureDirs?.[v];
      if (!overlayPath) {
        continue;
      }
      const featureName = overlayPath.split("/").pop();
      if (featureName === undefined) {
        continue;
      }
      const fSkills = featureSkillsDir(template.id, featureName);
      if (existsSync(fSkills)) {
        mkdirSync(skillsTarget, { recursive: true });
        cpSync(fSkills, skillsTarget, { recursive: true, force: true });
      }
    }
  }
}

function postCopy(projectDir: string, vars: { name: string; pm: PackageManager }): void {
  const gitignoreStub = join(projectDir, "_gitignore");
  if (existsSync(gitignoreStub)) {
    renameSync(gitignoreStub, join(projectDir, ".gitignore"));
  }
  const npmrcStub = join(projectDir, "_npmrc");
  if (existsSync(npmrcStub)) {
    renameSync(npmrcStub, join(projectDir, ".npmrc"));
  }
  substituteVars(projectDir, vars);
}

function substituteVars(dir: string, vars: { name: string; pm: PackageManager }): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".git") {
        continue;
      }
      substituteVars(full, vars);
      continue;
    }
    if (
      !/\.(json|md|ts|tsx|js|jsx|html|css|yaml|yml|toml|env.*|config\.ts)$/.test(entry) &&
      !["package.json", "README.md", "tsconfig.json"].includes(entry)
    ) {
      continue;
    }
    const contents = readFileSync(full, "utf8");
    if (!contents.includes("{{")) {
      continue;
    }
    writeFileSync(full, renderTemplate(contents, { name: vars.name, pm: vars.pm }));
  }
}

function absolutePath(name: string): string {
  return name.startsWith("/") ? name : join(process.cwd(), name);
}

function assertFreshTarget(dir: string): void {
  if (!existsSync(dir)) {
    return;
  }
  const contents = readdirSync(dir);
  if (contents.length === 0) {
    return;
  }
  throw new Error(`Target directory ${dir} is not empty`);
}

function runWord(pm: PackageManager): string {
  if (pm === "npm") {
    return "npm run";
  }
  return pm;
}
