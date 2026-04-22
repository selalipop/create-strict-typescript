---
name: ui-daisyui
description: Explains this project's DaisyUI + Tailwind 4 wiring — plugin placement in globals.css, theme switching via data-theme, class conventions. Use when adding a themed component, customizing the theme, or debugging Tailwind classes that don't apply.
---

# DaisyUI

This project uses DaisyUI as a component layer on top of Tailwind 4.

## How it's wired

- Tailwind 4 is loaded via `@tailwindcss/vite` (no `tailwind.config.*`; Tailwind 4 is config-less via CSS)
- DaisyUI is registered in `src/styles/globals.css` with `@plugin "daisyui"`
- `globals.css` is imported in `src/routes/__root.tsx` so it applies everywhere

## Theme switching

DaisyUI themes are applied via `data-theme` on a parent element (usually `<html>`):

```tsx
<html data-theme="dark">
```

Or dynamically:
```tsx
document.documentElement.setAttribute("data-theme", "light");
```

Built-in themes: `light`, `dark`, `cupcake`, `bumblebee`, `corporate`, ... See [daisyui.com/themes](https://daisyui.com/themes).

To enable specific themes, expand the plugin config in `globals.css`:
```css
@plugin "daisyui" {
  themes: light --default, dark --prefersdark, cupcake;
}
```

## Class conventions

Component classes: `btn`, `btn-primary`, `card`, `modal`, `input`, `navbar`, etc. Combine with Tailwind utilities (`btn btn-primary mt-4 w-full`).

```tsx
<button className="btn btn-primary">Save</button>
<div className="card bg-base-100 shadow-xl">
  <div className="card-body">...</div>
</div>
```

Semantic colors (not Tailwind palette names): `bg-primary`, `text-base-content`, `border-neutral`. These adapt to the active theme.

## Anti-patterns

- Mixing DaisyUI components with HeroUI / Radix primitives — the visual languages differ. Pick one per surface.
- Hardcoding palette colors (`bg-blue-500`) on themed components — breaks dark mode / theme switch. Use semantic colors.
- Reinventing a component that DaisyUI already provides (modal, drawer, tabs). DaisyUI handles accessibility boilerplate.

## Related skills

- `tanstack-start` — `__root.tsx` is where `globals.css` is imported
