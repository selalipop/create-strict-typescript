# {{name}}

A Node CLI built with [citty](https://github.com/unjs/citty) and [tsdown](https://tsdown.dev).

## Scripts

- `{{pm}} dev` — rebuild on change
- `{{pm}} build` — bundle to `dist/cli.mjs`
- `{{pm}} lint` — Biome + Oxlint + typecheck
- `{{pm}} fix` — auto-fix lint issues

## Run locally

```sh
{{pm}} build
./dist/cli.mjs hello
./dist/cli.mjs hello world
```
