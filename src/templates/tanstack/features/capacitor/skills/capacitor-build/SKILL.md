---
name: capacitor-build
description: Explains this project's Capacitor iOS/Android setup — the webDir invariant, VITE_SPA_MODE toggle, safe-area CSS variables, cap add one-time bootstrap. Use when running a mobile build, adding a native plugin, or debugging why the mobile build doesn't match web.
---

# Capacitor build

This project can build for iOS and Android via Capacitor. The web SPA is bundled as a static Capacitor asset; native plugins add the mobile capabilities.

## One-time bootstrap

`ios/` and `android/` directories are **not** in this template — Capacitor's CLI generates them and they're OS-dependent. Run these once, after cloning:

```sh
pnpm build:spa            # produces dist/client/ (what Capacitor wraps)
pnpm dlx cap add ios       # generates ios/ (needs Xcode on macOS)
pnpm dlx cap add android   # generates android/ (needs Android Studio)
```

Commit `ios/` and `android/` only if you need to share them across machines — often repos `.gitignore` them and each dev runs `cap add` locally.

## Build + run

```sh
pnpm cap:run:ios       # build:spa + cap sync ios + cap run ios
pnpm cap:run:android   # same for android
```

Or for just sync without running:
```sh
pnpm cap:sync:ios
pnpm cap:sync:android
```

## Invariants (don't break these)

- **`webDir: "dist/client"`** in `capacitor.config.ts` must match Vite's client bundle output. TanStack Start defaults to `dist/client`; don't override `build.outDir` in `vite.config.ts` without also updating `capacitor.config.ts`.
- **`VITE_SPA_MODE=true`** is the mobile build toggle. When set:
  - `vite.config.ts` skips the Nitro SSR plugin (no server bundle)
  - `tanstackStart({ spa: { enabled: true, ... } })` produces a crawlable SPA
  - Output is static `dist/client/` only; no `.output/server/`
  - Capacitor wraps this bundle in the native WebView
- **Don't import Node-only APIs** (`fs`, `node:child_process`, anything from `src/server/`) in client code. Web dev / SSR masks these, but the mobile build has no server to fall back to.

## Safe-area insets

If the template includes `SystemBars.insetsHandling: "css"` in `capacitor.config.ts` (recommended), iOS/Android publish safe area as CSS variables:

```css
--safe-area-top, --safe-area-bottom, --safe-area-left, --safe-area-right
```

Apply them in the shell layout, not per-component. Example:
```tsx
<div style={{
  paddingTop: "var(--safe-area-top)",
  paddingBottom: "var(--safe-area-bottom)",
}}>
```

Without this, the native WebView defaults to zero padding around notches / home indicator.

## Live reload during dev

Set `CAPACITOR_LIVE_URL` to a tunnel URL (ngrok, cloudflared, tailscale funnel) and `cap:sync:*` will configure the WebView to load from that URL instead of the bundled static assets. The bundled `capacitor.config.ts` reads `process.env.CAPACITOR_LIVE_URL`.

## Adding a native plugin

```sh
pnpm add @capacitor/camera
pnpm cap:sync:ios     # runs `cap sync ios` under the hood
```

`cap sync` copies web assets + updates native project config with the new plugin. You may need to update Info.plist / AndroidManifest.xml for permissions (Capacitor prompts you).

## Anti-patterns

- Overriding Vite `build.outDir` without updating `webDir` → the mobile build loads the wrong directory (or nothing).
- Running `pnpm build` (SSR mode) for mobile — that emits `.output/server/` which Capacitor can't use. Always `pnpm build:spa`.
- Committing `ios/App/App/public/` or similar cap-sync outputs. Those are regenerated every sync; gitignore them (the default `.gitignore` does).
- Storing secrets in `capacitor.config.ts`. That file ships inside the app; treat everything there as public.

## Related skills

- `tanstack-start` — what the Vite plugin ordering looks like and why SPA mode skips Nitro
