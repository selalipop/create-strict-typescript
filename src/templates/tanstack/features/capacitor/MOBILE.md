# Mobile (Capacitor)

The generator wires Capacitor in but does **not** create the native `ios/` and `android/` project directories — Capacitor's own CLI does that, and it needs Xcode / Android Studio available locally.

## One-time setup

```sh
pnpm build:spa
pnpm dlx cap add ios
pnpm dlx cap add android
```

## Build + run

```sh
pnpm cap:run:ios
pnpm cap:run:android
```

## Live reload during dev

Set `CAPACITOR_LIVE_URL` to a tunnel URL (e.g. ngrok / cloudflared) before `cap:sync:*` to enable live reload from the device.
