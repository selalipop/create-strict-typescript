import { readFileSync } from "node:fs";
import { join } from "node:path";
import { detect, getUserAgent } from "package-manager-detector";
import type { PackageManager } from "../templates/types.ts";

const SUPPORTED: ReadonlySet<PackageManager> = new Set(["npm", "pnpm", "yarn", "bun"]);

export function detectPackageManagerFromUserAgent(): PackageManager | undefined {
  const ua = getUserAgent();
  if (ua && SUPPORTED.has(ua as PackageManager)) {
    return ua as PackageManager;
  }
  return undefined;
}

export async function detectPackageManagerFromCwd(
  cwd: string,
): Promise<PackageManager | undefined> {
  const result = await detect({ cwd });
  if (result && SUPPORTED.has(result.name as PackageManager)) {
    return result.name as PackageManager;
  }
  return undefined;
}

export async function detectPackageManager(cwd: string): Promise<PackageManager | undefined> {
  return detectPackageManagerFromUserAgent() ?? (await detectPackageManagerFromCwd(cwd));
}

export interface HostProjectInfo {
  hasPackageJson: boolean;
  hasReact: boolean;
  hasNext: boolean;
  hasVite: boolean;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export function inspectHostProject(projectDir: string): HostProjectInfo {
  const pkgPath = join(projectDir, "package.json");
  let raw: string;
  try {
    raw = readFileSync(pkgPath, "utf8");
  } catch {
    return {
      hasPackageJson: false,
      hasReact: false,
      hasNext: false,
      hasVite: false,
      dependencies: {},
      devDependencies: {},
    };
  }
  const pkg = JSON.parse(raw) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const deps = pkg.dependencies ?? {};
  const devDeps = pkg.devDependencies ?? {};
  const allDeps = { ...deps, ...devDeps };
  return {
    hasPackageJson: true,
    hasReact: "react" in allDeps || "@types/react" in allDeps,
    hasNext: "next" in allDeps,
    hasVite: "vite" in allDeps,
    dependencies: deps,
    devDependencies: devDeps,
  };
}
