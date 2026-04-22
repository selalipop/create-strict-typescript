import { templateFilesDir } from "../../util/paths.ts";
import type { Template } from "../types.ts";

export const cliNodeTemplate: Template = {
  id: "cli-node",
  label: "cli-node",
  description: "Publishable Node CLI — citty + tsdown, ships a bin entry",
  baseFilesDir: templateFilesDir("cli-node"),
  applyCore: true,
  wantsReact: false,
};
