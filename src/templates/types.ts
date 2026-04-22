export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export type PromptKind = "select" | "multiselect" | "confirm";

export interface PromptOption {
  value: string;
  label: string;
  hint?: string;
}

export interface TemplatePrompt {
  key: string;
  kind: PromptKind;
  message: string;
  options?: PromptOption[];
  initialValue?: unknown;
}

export interface ScaffoldContext {
  projectDir: string;
  projectName: string;
  pm: PackageManager;
  flags: Record<string, unknown>;
  templateDir: string;
}

export interface Template {
  id: string;
  label: string;
  description: string;
  prompts?: TemplatePrompt[];
  baseFilesDir: string;
  featureDirs?: Record<string, string>;
  postScaffold?: (ctx: ScaffoldContext) => Promise<void>;
  applyCore?: boolean;
  wantsReact?: boolean;
}
