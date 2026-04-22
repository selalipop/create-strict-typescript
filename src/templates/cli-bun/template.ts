import { templateFilesDir } from "../../util/paths.ts";
import type { Template } from "../types.ts";

export const cliBunTemplate: Template = {
  id: "cli-bun",
  label: "cli-bun",
  description: "Bun CLI — runs .ts directly, bun build --compile for single-file binary",
  baseFilesDir: templateFilesDir("cli-bun"),
  applyCore: true,
  wantsReact: false,
};
