import { spawn } from "node:child_process";
import type { PackageManager } from "../templates/types.ts";

export async function runInstall(pm: PackageManager, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(pm, ["install"], {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${pm} install exited with code ${code}`));
      }
    });
  });
}

import { existsSync } from "node:fs";
import { join } from "node:path";

export async function runBiomeFormat(_pm: PackageManager, cwd: string): Promise<void> {
  const biomeBin = join(cwd, "node_modules", ".bin", "biome");
  if (!existsSync(biomeBin)) {
    return;
  }
  return new Promise((resolve, reject) => {
    const child = spawn(biomeBin, ["check", "--write", "--unsafe", "."], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0 || code === 1) {
        resolve();
      } else {
        reject(new Error(`biome format exited with code ${code}`));
      }
    });
  });
}

export async function runTsrGenerate(cwd: string): Promise<boolean> {
  const tsrBin = join(cwd, "node_modules", ".bin", "tsr");
  if (!existsSync(tsrBin)) {
    return false;
  }
  return new Promise((resolve) => {
    const child = spawn(tsrBin, ["generate"], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
    child.once("error", () => resolve(false));
    child.once("exit", (code) => {
      resolve(code === 0);
    });
  });
}

export function runPMExec(pm: PackageManager): string {
  switch (pm) {
    case "bun":
      return "bun exec";
    case "pnpm":
      return "pnpm exec";
    case "yarn":
      return "yarn";
    default:
      return "npx";
  }
}

export function pmRun(pm: PackageManager, script: string): string {
  switch (pm) {
    case "bun":
      return `bun run ${script}`;
    case "pnpm":
      return `pnpm ${script}`;
    case "yarn":
      return `yarn ${script}`;
    default:
      return `npm run ${script}`;
  }
}
