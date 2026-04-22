---
name: heroui-ssr
description: Explains the HeroUI v3 setup in this project — Provider wrap, Vite ssr.noExternal requirement, react-aria-components coupling. Use when adding a HeroUI component, debugging SSR hydration issues, or Vite build errors mentioning @heroui or react-aria-components.
---

# HeroUI SSR

HeroUI v3 is a React Aria–based component library. Because its packages ship ES modules that need transpilation for SSR, it requires specific Vite config.

## How it's wired

- `@heroui/react` + `@heroui/styles` in `dependencies`
- `react-aria-components` in `dependencies` (HeroUI peer)
- `vite.config.ts` has `ssr: { noExternal: [/^@heroui\//, "react-aria-components"] }` — **do not remove** this. Without it, Nitro/Node tries to load ESM HeroUI modules as CommonJS and the build breaks with cryptic "ERR_REQUIRE_ESM" errors.
- `src/routes/__root.tsx` wraps `<Outlet />` in `<HeroUIProvider>` — required for the Provider context HeroUI components need.
- `src/styles/globals.css` imports `@heroui/styles`

## Using components

```tsx
import { Button, Card, CardBody } from "@heroui/react";

<Button color="primary" onPress={() => /* ... */}>Save</Button>
<Card><CardBody>...</CardBody></Card>
```

Event names may differ from native React (e.g., `onPress` not `onClick`) — this is React Aria's input abstraction; it handles keyboard + touch + mouse uniformly.

## Common SSR pitfalls

- **Added a new HeroUI sub-package (e.g., `@heroui/theme`)**: it's already covered by the `/^@heroui\//` regex in `noExternal`. No config change needed.
- **Added a new react-aria sub-package** (`react-aria`, `@react-aria/*`): may also need to be added to `noExternal` list if it ships as pure ESM.
- **Hydration warnings**: usually from non-deterministic initial state (e.g., `Date.now()` in a component). HeroUI itself is SSR-safe; the issue is in your component.

## Styling

HeroUI components accept `classNames` prop for fine-grained Tailwind overrides:

```tsx
<Button classNames={{ base: "rounded-full px-8" }}>...</Button>
```

Prefer this over wrapping components in styled divs. Also available: `className` which is forwarded to the root element.

## Anti-patterns

- Removing `ssr.noExternal` "because the dev server works fine" — prod SSR will break.
- Mixing HeroUI with DaisyUI on the same surface. Pick one.
- Forgetting the Provider wrap — components will silently render without theming / keyboard support.

## Related skills

- `tanstack-start` — `__root.tsx` structure and where the Provider wrap lives
