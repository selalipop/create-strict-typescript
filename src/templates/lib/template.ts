import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "comment-json";
import { templateFilesDir } from "../../util/paths.ts";
import type { ScaffoldContext, Template } from "../types.ts";

export const libTemplate: Template = {
  id: "lib",
  label: "lib",
  description: "Minimal TypeScript library — no framework, optional tsdown build",
  baseFilesDir: templateFilesDir("lib"),
  prompts: [
    {
      key: "build",
      kind: "select",
      message: "Add a build tool?",
      initialValue: "tsdown",
      options: [
        { value: "tsdown", label: "tsdown", hint: "fast, ESM-first (recommended)" },
        { value: "none", label: "none", hint: "no build step" },
      ],
    },
  ],
  applyCore: true,
  wantsReact: false,
  postScaffold: async (ctx: ScaffoldContext) => {
    const build = ctx.flags.build === "none" ? "none" : "tsdown";
    const pkgPath = join(ctx.projectDir, "package.json");
    const pkg = parse(readFileSync(pkgPath, "utf8")) as Record<string, unknown>;
    const scripts = (pkg.scripts as Record<string, string> | undefined) ?? {};
    const devDeps = (pkg.devDependencies as Record<string, string> | undefined) ?? {};
    if (build === "tsdown") {
      scripts.build = "tsdown";
      scripts.dev = "tsdown --watch";
      devDeps.tsdown = "^0.21.9";
      pkg.scripts = scripts;
      pkg.devDependencies = devDeps;
      writeFileSync(pkgPath, `${stringify(pkg, null, 2)}\n`);
      writeFileSync(
        join(ctx.projectDir, "tsdown.config.ts"),
        `import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
});
`,
      );
    }
  },
};
