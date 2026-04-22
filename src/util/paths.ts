import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

let cachedPackageRoot: string | undefined;

export function packageRoot(): string {
  if (cachedPackageRoot !== undefined) {
    return cachedPackageRoot;
  }
  let current = dirname(fileURLToPath(import.meta.url));
  const stopAt = resolve("/");
  while (current !== stopAt) {
    const pkgPath = join(current, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { name?: string };
        if (pkg.name === "create-strict-typescript") {
          cachedPackageRoot = current;
          return current;
        }
      } catch {
        // ignore
      }
    }
    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  throw new Error("Unable to locate create-strict-typescript package root");
}

export function templateFilesDir(templateId: string): string {
  return join(packageRoot(), "src", "templates", templateId, "files");
}

export function templateFeatureDir(templateId: string, featureName: string): string {
  return join(packageRoot(), "src", "templates", templateId, "features", featureName);
}

export function coreSkillsDir(): string {
  return join(packageRoot(), "src", "core", "skills");
}

export function templateSkillsDir(templateId: string): string {
  return join(packageRoot(), "src", "templates", templateId, "skills");
}

export function featureSkillsDir(templateId: string, featureName: string): string {
  return join(packageRoot(), "src", "templates", templateId, "features", featureName, "skills");
}
