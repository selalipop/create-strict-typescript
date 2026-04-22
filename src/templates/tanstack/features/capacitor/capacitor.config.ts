import type { CapacitorConfig } from "@capacitor/cli";

const liveReloadUrl = process.env.CAPACITOR_LIVE_URL;

const config: CapacitorConfig = {
  appId: "com.example.{{name}}",
  appName: "{{name}}",
  webDir: "dist/client",
  ...(liveReloadUrl ? { server: { url: liveReloadUrl, cleartext: true } } : {}),
};

export default config;
