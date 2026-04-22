import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "comment-json";
import { templateFeatureDir, templateFilesDir } from "../../util/paths.ts";
import type { ScaffoldContext, Template } from "../types.ts";

const TEMPLATE_ID = "tanstack";

export const tanstackTemplate: Template = {
  id: TEMPLATE_ID,
  label: "tanstack",
  description: "Full-stack TanStack Start + oRPC, optional Capacitor / Drizzle / UI",
  baseFilesDir: templateFilesDir(TEMPLATE_ID),
  applyCore: true,
  wantsReact: true,
  prompts: [
    {
      key: "auth",
      kind: "select",
      message: "Auth",
      initialValue: "placeholder",
      options: [
        { value: "placeholder", label: "placeholder", hint: "extensible seam (default)" },
        { value: "supabase", label: "Supabase", hint: "cookie-based session via @supabase/ssr" },
        { value: "none", label: "none", hint: "empty oRPC context" },
      ],
    },
    {
      key: "ui",
      kind: "select",
      message: "UI library",
      initialValue: "none",
      options: [
        { value: "none", label: "none", hint: "just Tailwind 4" },
        { value: "daisyui", label: "DaisyUI", hint: "Tailwind component library" },
        { value: "heroui", label: "HeroUI v3", hint: "React Aria–based" },
      ],
    },
    {
      key: "db",
      kind: "select",
      message: "Database",
      initialValue: "none",
      options: [
        { value: "none", label: "none" },
        { value: "drizzle", label: "Drizzle + SQLite", hint: "better-sqlite3" },
      ],
    },
    {
      key: "capacitor",
      kind: "confirm",
      message: "Include Capacitor (iOS + Android)?",
      initialValue: false,
    },
  ],
  featureDirs: {
    "auth:placeholder": templateFeatureDir(TEMPLATE_ID, "auth-placeholder"),
    "auth:supabase": templateFeatureDir(TEMPLATE_ID, "auth-supabase"),
    "ui:daisyui": templateFeatureDir(TEMPLATE_ID, "ui-daisyui"),
    "ui:heroui": templateFeatureDir(TEMPLATE_ID, "ui-heroui"),
    "db:drizzle": templateFeatureDir(TEMPLATE_ID, "drizzle"),
    "capacitor:true": templateFeatureDir(TEMPLATE_ID, "capacitor"),
  },
  postScaffold: async (ctx: ScaffoldContext) => {
    const pkgPath = join(ctx.projectDir, "package.json");
    const pkg = parse(readFileSync(pkgPath, "utf8")) as Record<string, unknown>;
    const deps = (pkg.dependencies as Record<string, string> | undefined) ?? {};
    const devDeps = (pkg.devDependencies as Record<string, string> | undefined) ?? {};
    const scripts = (pkg.scripts as Record<string, string> | undefined) ?? {};

    const auth = String(ctx.flags.auth ?? "placeholder");
    const ui = String(ctx.flags.ui ?? "none");
    const db = String(ctx.flags.db ?? "none");
    const capacitor = ctx.flags.capacitor === true;

    if (auth === "supabase") {
      deps["@supabase/supabase-js"] = "^2.49.0";
      deps["@supabase/ssr"] = "^0.10.2";
    }
    if (ui === "daisyui") {
      deps.daisyui = "^5.5.19";
    }
    if (ui === "heroui") {
      deps["@heroui/react"] = "^3.0.3";
      deps["@heroui/styles"] = "^3.0.3";
      deps["react-aria-components"] = "^1.8.0";
    }
    if (db === "drizzle") {
      deps["drizzle-orm"] = "^0.45.2";
      deps["better-sqlite3"] = "^12.2.0";
      devDeps["drizzle-kit"] = "^0.31.8";
      devDeps["@types/better-sqlite3"] = "^7.6.12";
      scripts["db:push"] = "drizzle-kit push";
      scripts["db:generate"] = "drizzle-kit generate";
      scripts["db:studio"] = "drizzle-kit studio";
    }
    if (capacitor) {
      deps["@capacitor/core"] = "^8.3.1";
      deps["@capacitor/ios"] = "^8.3.1";
      deps["@capacitor/android"] = "^8.3.1";
      deps["@capacitor/app"] = "^8.1.0";
      devDeps["@capacitor/cli"] = "^8.3.1";
      scripts["build:spa"] = "VITE_SPA_MODE=true vite build";
      scripts["cap:sync:ios"] = "pnpm build:spa && cap sync ios";
      scripts["cap:sync:android"] = "pnpm build:spa && cap sync android";
      scripts["cap:run:ios"] = "pnpm cap:sync:ios && cap run ios";
      scripts["cap:run:android"] = "pnpm cap:sync:android && cap run android";
    }

    pkg.dependencies = deps;
    pkg.devDependencies = devDeps;
    pkg.scripts = scripts;
    writeFileSync(pkgPath, `${stringify(pkg, null, 2)}\n`);

    if (ui === "heroui") {
      wrapRootWithHeroUI(ctx.projectDir);
      addHeroUISsrExternals(ctx.projectDir);
    }
    if (ui === "daisyui" || ui === "heroui") {
      appendUICssImports(ctx.projectDir, ui);
    }
  },
};

function wrapRootWithHeroUI(projectDir: string): void {
  const path = join(projectDir, "src", "routes", "__root.tsx");
  let content = readFileSync(path, "utf8");
  if (content.includes("HeroUIProvider")) {
    return;
  }
  content = content.replace(
    /^(import .*? from "[^"]*";)\n/m,
    `$1\nimport { HeroUIProvider } from "@heroui/react";\n`,
  );
  content = content.replace(/<Outlet \/>/g, `<HeroUIProvider><Outlet /></HeroUIProvider>`);
  writeFileSync(path, content);
}

function addHeroUISsrExternals(projectDir: string): void {
  const path = join(projectDir, "vite.config.ts");
  let content = readFileSync(path, "utf8");
  if (content.includes("@heroui")) {
    return;
  }
  content = content.replace(
    /(export default defineConfig\([^{]*{)/,
    `$1\n  ssr: { noExternal: [/^@heroui\\//, "react-aria-components"] },`,
  );
  writeFileSync(path, content);
}

function appendUICssImports(projectDir: string, ui: string): void {
  const path = join(projectDir, "src", "styles", "globals.css");
  let content = readFileSync(path, "utf8");
  if (ui === "daisyui" && !content.includes("daisyui")) {
    content += `\n@plugin "daisyui";\n`;
  }
  if (ui === "heroui" && !content.includes("@heroui/styles")) {
    content += `\n@import "@heroui/styles";\n`;
  }
  writeFileSync(path, content);
}
