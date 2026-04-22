import { cliBunTemplate } from "./cli-bun/template.ts";
import { cliNodeTemplate } from "./cli-node/template.ts";
import { libTemplate } from "./lib/template.ts";
import { tanstackTemplate } from "./tanstack/template.ts";
import type { Template } from "./types.ts";

export const templates: readonly Template[] = [
  tanstackTemplate,
  cliNodeTemplate,
  cliBunTemplate,
  libTemplate,
];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}
