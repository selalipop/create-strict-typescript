---
name: pre-commit
description: Explains the husky + lint-staged pre-commit hook this project runs on every commit and what to do when it fails. Use when a commit is rejected by the hook or when adding / modifying the hook.
---

# Pre-commit hook

On every `git commit`, `.husky/pre-commit` runs `lint-staged`, which runs Biome + Oxlint auto-fixers on the staged files only (not the whole repo).

## What the hook does

Configured in `package.json` under `lint-staged`:

```json
{
  "*.{ts,tsx,js,jsx}": [
    "biome check --write",
    "oxlint --disable-unicorn-plugin ... --fix"
  ]
}
```

- Biome formats and fixes staged files in place
- Oxlint fixes what it can (unused imports, simple rewrites)
- Fixed files are **re-staged automatically** by lint-staged, so the commit picks them up
- If any rule can't auto-fix (e.g., a type error, a floating promise requiring human judgment), the commit aborts with the error

## When a commit is rejected

The hook prints the failing tool's output. The two common reasons:

1. **A file has lint errors that can't be auto-fixed** — fix them by hand (often `pnpm lint` at the repo root shows the full context), stage the fix, commit again.
2. **A type error** — tsgo is NOT run in the hook by default (only on staged files via Oxlint's type-aware rules). If you see this, run `pnpm typecheck` to see all of them.

## When `--no-verify` is and isn't acceptable

- ✅ Local throwaway commits you'll rewrite before push (`git commit --no-verify -m "wip"`), then `git rebase -i` before pushing.
- ❌ Bypassing the hook to land code with known lint failures. CI will catch it and the fix will live in a separate commit forever.

If a rule is wrong for this project, update the config instead of skipping the hook.

## Invariants

- **Don't disable the hook entirely** (`HUSKY=0`) in the committed config. It's per-developer if anything; see husky docs.
- The `prepare` script in `package.json` runs `husky` on `pnpm install`, which wires up the hook. If a contributor clones and commits without installing, the hook won't fire — that's a known tradeoff, CI catches it.

## Related skills

- `lint-stack` — what the fixers actually do and how to run them manually
