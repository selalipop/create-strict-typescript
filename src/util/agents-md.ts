import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface SkillMeta {
  name: string;
  description: string;
  path: string;
}

const FRONTMATTER_FENCE = /^---\s*\n([\s\S]*?)\n---\s*\n/;

export function parseSkillFrontmatter(
  content: string,
): { name: string; description: string } | undefined {
  const match = FRONTMATTER_FENCE.exec(content);
  if (!match) {
    return undefined;
  }
  const body = match[1];
  if (body === undefined) {
    return undefined;
  }
  const fields: Record<string, string> = {};
  let currentKey: string | undefined;
  let buffer: string[] = [];
  const flush = (): void => {
    if (currentKey !== undefined) {
      fields[currentKey] = buffer.join(" ").trim();
      buffer = [];
    }
  };
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trimEnd();
    if (line === "") {
      continue;
    }
    const keyMatch = /^([a-zA-Z0-9_-]+):\s*(.*)$/.exec(line);
    if (keyMatch && !rawLine.startsWith(" ") && !rawLine.startsWith("\t")) {
      flush();
      currentKey = keyMatch[1];
      const value = keyMatch[2] ?? "";
      buffer = value !== "" ? [stripQuotes(value)] : [];
    } else {
      buffer.push(line.trim());
    }
  }
  flush();
  const name = fields.name;
  const description = fields.description;
  if (name === undefined || description === undefined) {
    return undefined;
  }
  return { name, description };
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function collectSkills(projectDir: string): SkillMeta[] {
  const skillsRoot = join(projectDir, ".claude", "skills");
  if (!existsSync(skillsRoot)) {
    return [];
  }
  const results: SkillMeta[] = [];
  for (const entry of readdirSync(skillsRoot)) {
    const entryPath = join(skillsRoot, entry);
    if (!statSync(entryPath).isDirectory()) {
      continue;
    }
    const skillMd = join(entryPath, "SKILL.md");
    if (!existsSync(skillMd)) {
      continue;
    }
    const raw = readFileSync(skillMd, "utf8");
    const meta = parseSkillFrontmatter(raw);
    if (meta) {
      results.push({
        name: meta.name,
        description: meta.description,
        path: `.claude/skills/${entry}/SKILL.md`,
      });
    }
  }
  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}

export interface AgentsMdOptions {
  projectName: string;
  templateId: string;
  packageManager: string;
}

export function generateAgentsMd(projectDir: string, opts: AgentsMdOptions): void {
  const skills = collectSkills(projectDir);
  const pm = opts.packageManager;
  const lines: string[] = [];
  lines.push(`# AGENTS.md`);
  lines.push("");
  lines.push(
    `Orientation for AI coding agents (Claude Code, Codex, Cursor, Copilot, Gemini CLI, Windsurf, Amp, Devin) working in this project. This file follows the [AGENTS.md](https://agents.md/) convention.`,
  );
  lines.push("");
  lines.push(`## Project`);
  lines.push("");
  lines.push(`- **Name:** \`${opts.projectName}\``);
  lines.push(
    `- **Starter:** \`${opts.templateId}\` (via [create-strict-typescript](https://www.npmjs.com/package/create-strict-typescript))`,
  );
  lines.push(`- **Package manager:** \`${pm}\``);
  lines.push("");
  lines.push(`## Scripts`);
  lines.push("");
  lines.push(`- \`${pmRun(pm, "lint")}\` — Biome + Oxlint + tsgo, must pass before committing`);
  lines.push(`- \`${pmRun(pm, "fix")}\` — auto-fix lint issues (safe)`);
  lines.push(`- \`${pmRun(pm, "typecheck")}\` — type-only check`);
  lines.push("");
  lines.push(`## Per-topic guidance`);
  lines.push("");
  if (skills.length === 0) {
    lines.push(`_No skills installed. See \`.claude/skills/\` — it's currently empty._`);
  } else {
    lines.push(
      `This project ships focused [Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) — one topic per file, auto-discovered by Claude Code, Codex CLI, Cursor, Gemini CLI, and Copilot. Prefer reading the specific skill over guessing.`,
    );
    lines.push("");
    for (const skill of skills) {
      lines.push(`### ${skill.name}`);
      lines.push("");
      lines.push(skill.description);
      lines.push("");
      lines.push(`See [\`${skill.path}\`](./${skill.path}).`);
      lines.push("");
    }
  }
  lines.push(`## Conventions`);
  lines.push("");
  lines.push(`- Prefer editing existing files over creating new ones.`);
  lines.push(`- Run \`${pmRun(pm, "lint")}\` before claiming a change is done.`);
  lines.push(
    `- Strict TypeScript is on (\`noUncheckedIndexedAccess\`, \`exactOptionalPropertyTypes\`, \`useUnknownInCatchVariables\`) — see the \`strict-typescript\` skill for idiomatic fixes.`,
  );
  lines.push("");
  writeFileSync(join(projectDir, "AGENTS.md"), `${lines.join("\n")}\n`);

  const claudeMdPath = join(projectDir, "CLAUDE.md");
  if (!existsSync(claudeMdPath)) {
    writeFileSync(
      claudeMdPath,
      `# CLAUDE.md\n\nSee [AGENTS.md](./AGENTS.md) for project orientation and a list of installed skills.\n`,
    );
  }
}

function pmRun(pm: string, script: string): string {
  switch (pm) {
    case "npm":
      return `npm run ${script}`;
    case "yarn":
      return `yarn ${script}`;
    case "bun":
      return `bun run ${script}`;
    default:
      return `pnpm ${script}`;
  }
}
