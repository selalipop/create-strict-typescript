---
name: lint-stack
description: Describes which tool (Biome, Oxlint, tsgo) catches which class of error in this project and how to run fixers. Use when a lint error appears, when you're unsure which tool to invoke to auto-fix, or when you need to suppress a rule.
---

# Lint stack

This project runs three checkers, each specialized. Know which one to point at a problem.

## Tool responsibilities

| Tool | Catches | Auto-fixes |
|---|---|---|
| **Biome** (`pnpm lint:biome`) | Formatting, import sorting, style rules (e.g., `useBlockStatements`) | Yes (safe fixes in `fix`, unsafe in `fixunsafe`) |
| **Oxlint** (`pnpm lint:oxc`) | ESLint-family rules, type-aware rules (via `oxlint-tsgolint`), React Hooks rules | Yes (`oxlint . --fix`) |
| **tsgo** (`pnpm typecheck`) | All type errors | No (compiler, not a fixer) |

## Commands

- **`pnpm lint`** — run biome + oxlint + tsgo in sequence. Runs in CI. Must pass before push.
- **`pnpm fix`** — apply biome safe fixes + oxlint safe fixes. Try this first.
- **`pnpm fixunsafe`** — applies the unsafe fixers too (e.g., dot-notation conversion, dead-code removal). Review the diff.
- **`pnpm typecheck`** — tsgo-only, fastest way to see type errors without running lint.

## Decision guide

- Something about formatting, imports, blocks, quotes? **Biome.**
- Something about unused vars, floating promises, `no-unnecessary-condition`, React Hook deps? **Oxlint.**
- Something about types not matching, missing properties, wrong return type? **tsgo.**

If you don't know which it is, `pnpm lint` prints tool-prefixed output so you can tell.

## Scope-suppressing rules (use sparingly)

```ts
// Biome: one line
// biome-ignore lint/<group>/<rule>: <reason>
const x = unusedIntentionally;

// Biome: whole file header
/** biome-ignore-all lint/<group>/<rule>: <reason> */

// Oxlint
// oxlint-disable-next-line <rule>
const y = fine;
```

**Always include a reason.** A suppression without one rots; reviewers cannot tell if it's still needed.

## Anti-patterns

- `// @ts-ignore` without a reason — if you need a type escape hatch, prefer `// @ts-expect-error` with a message so it breaks when the underlying issue is fixed.
- Bulk-disabling a rule via config to hide a class of bugs. If the rule has too many false positives, replace its config with a narrower one — don't turn it off.
- Running `pnpm fixunsafe` and committing without reading the diff. Unsafe fixes can change behavior.

## Related skills

- `strict-typescript` — the type-system flags that pair with Oxlint's type-aware rules
- `pre-commit` — staged files are biome-format + oxlint-fix'd automatically on commit
