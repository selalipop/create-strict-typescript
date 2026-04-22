export function renderTemplate(source: string, vars: Record<string, string>): string {
  return source.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    return vars[key] ?? "";
  });
}

export function sanitizePackageName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/^[^a-z0-9@]+/, "")
    .replace(/[^a-z0-9\-._~/@]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
