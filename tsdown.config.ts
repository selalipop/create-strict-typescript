import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/cli.ts"],
  outDir: "dist",
  format: ["esm"],
  target: "node20",
  platform: "node",
  clean: true,
  shims: true,
  dts: false,
  minify: false,
  outExtensions: () => ({ js: ".mjs" }),
});
