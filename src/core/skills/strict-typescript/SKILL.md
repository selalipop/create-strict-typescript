---
name: strict-typescript
description: Explains the strict tsconfig flags this project uses (noUncheckedIndexedAccess, exactOptionalPropertyTypes, useUnknownInCatchVariables, etc.) and shows idiomatic fixes for the errors they produce. Use when a TypeScript error looks surprising or when touching indexing, optional properties, or catch clauses.
---

# Strict TypeScript baseline

This project opts into TypeScript flags beyond `strict: true`. An agent that doesn't know these are on will write code that fails to compile. These are the rules, the errors each produces, and the idiomatic fixes.

## Flags in effect

| Flag | Effect |
|---|---|
| `strict: true` | All standard strictness (nullchecks, implicit-any, etc.) |
| `noUncheckedIndexedAccess` | `arr[0]` is `T \| undefined`; `record[key]` is `V \| undefined` |
| `exactOptionalPropertyTypes` | `{ x?: string }` means x is **absent**, not `x: undefined` |
| `useUnknownInCatchVariables` | `catch (err)` binds `err` as `unknown` |
| `noImplicitOverride` | class methods overriding a base must use `override` |
| `noImplicitReturns` | every code path returns or throws |
| `noFallthroughCasesInSwitch` | switch cases must break / return / throw |
| `isolatedModules` | every file must be a module (affects bare `.ts` scripts) |

## Invariants

- **Never cast away an `undefined` from index access** — that's cheating the type system. Narrow instead.
- **Never add a property as `undefined`** to an object with `exactOptionalPropertyTypes` — either omit the key or conditionally spread.
- **Never retype `catch` as `any`** — narrow the `unknown` at the catch site.

## Idiomatic fixes

### `noUncheckedIndexedAccess`

```ts
// ❌ Compile error: 'items[0]' is 'string | undefined'
function first(items: string[]): string {
  return items[0];
}

// ✅ Narrow
function first(items: string[]): string {
  const head = items[0];
  if (head === undefined) {
    throw new Error("empty");
  }
  return head;
}

// ✅ Or express the empty case in the return type
function firstOrNone(items: string[]): string | undefined {
  return items[0];
}
```

### `exactOptionalPropertyTypes`

```ts
interface Config {
  name?: string;  // absent | string — NOT undefined
}

// ❌ Type '{ name: string | undefined; }' is not assignable to '{ name?: string; }'
const cfg: Config = { name: someValue };  // when someValue is `string | undefined`

// ✅ Conditional spread
const cfg: Config = { ...(someValue !== undefined ? { name: someValue } : {}) };

// ✅ Or change the interface if you really mean "set to undefined is meaningful"
interface Config { name: string | undefined; }
```

### `useUnknownInCatchVariables`

```ts
// ❌ err.message — Property 'message' does not exist on type 'unknown'
try {
  doWork();
} catch (err) {
  console.error(err.message);
}

// ✅ Narrow
try {
  doWork();
} catch (err) {
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error(String(err));
  }
}
```

### `noImplicitOverride`

```ts
class Child extends Base {
  // ❌ This member must have an 'override' modifier
  greet() { return "hi"; }

  // ✅
  override greet() { return "hi"; }
}
```

## Anti-patterns

- `as T` casts to satisfy `noUncheckedIndexedAccess` — if you're willing to assert non-undefined, you're also willing to throw on it: narrow explicitly.
- `// @ts-expect-error` to silence strict flags — almost always a sign that the type should be changed or the value narrowed.
- Widening an interface from `name?: string` to `name: string | undefined` "just to make it compile" — they mean different things. Pick deliberately.

## Related skills

- `lint-stack` — which linter catches what and when (Oxlint's `typescript/no-unnecessary-condition` pairs with these flags)
