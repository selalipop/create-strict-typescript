import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const isSpaMode = process.env.VITE_SPA_MODE === "true";

export default defineConfig({
  server: { port: 3000 },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [
    tailwindcss(),
    ...(isSpaMode ? [] : [nitro({ preset: "node-server" })]),
    tanstackStart({
      srcDirectory: "src",
      spa: isSpaMode
        ? { enabled: true, prerender: { crawlLinks: true, outputPath: "index.html" } }
        : undefined,
    }),
    viteReact(),
  ],
});
