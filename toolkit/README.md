# wow-declarations toolkit

This directory generates release-specific WoW API declarations from
[Gethe/wow-ui-source](https://github.com/Gethe/wow-ui-source) and gives addon
authors a fast TypeScript feedback loop that compiles to Lua with
[TypeScriptToLua](https://github.com/TypeScriptToLua/TypeScriptToLua).

It is a standalone npm package so it does not depend on the repository's legacy
Yarn 2 plus `ts-auto-mock` mock pipeline.

```
cd toolkit
npm install
npm run generate        # refresh generated/<release> and tsconfig.<release>.json
npm test                # property + fuzz suite (vitest + fast-check)
npm run build:lua       # compile the sample addon to Lua
npm run check:releases  # type-check the committed release declarations
```

## What generation produces

`npm run generate` reads the machine-readable API documentation that ships in
`Interface/AddOns/Blizzard_APIDocumentationGenerated` at the commit each release
pins in [`src/releases.ts`](src/releases.ts), and writes, per release:

- `generated/<release>/namespaces.d.ts` – the `C_*` function namespaces.
- `generated/<release>/enums.d.ts` – the global `Enum` members.
- `generated/<release>/structures.d.ts` – return/argument table shapes under `WowStruct`.
- `generated/<release>/objects.d.ts` – nominal placeholders for UI handles under `WowObject`.
- `generated/<release>/events.d.ts` – a `WowEvent.PayloadMap` from event name to payload tuple.
- `generated/<release>/protected.json` – the `Namespace.Function` names the client protects.
- `tsconfig.<release>.json` at the repository root, layering the generated types
  over the hand-written `declarations/` base.

The three releases are Retail (`12.1.x`), Mists of Pandaria Classic (`5.5.x`)
and Classic Era (`1.15.x`). To retarget a release at a newer client build, bump
its `commit` and `version` in `src/releases.ts` and rerun generation.

## The pipeline

[`src/parse.ts`](src/parse.ts) turns each doc file's Lua table into a plain
object with `luaparse`, so no Lua VM runs and the upstream files never execute.
[`src/typemap.ts`](src/typemap.ts) maps a Blizzard type to a TypeScript type and
[`src/emit.ts`](src/emit.ts) prints the declarations. `typemap` and `emit` are
pure, which is what lets the property suite drive them with generated input.

## Property and fuzz tests

`test/` uses `fast-check` on `vitest`. The suites fuzz the parser with a
serialize-then-parse round trip, drive `mapType`/`safeParamName` with adversarial
names, and type-check emitter output for randomly generated documentation so a
malformed signature (for example a required tuple element after an optional one)
fails a test rather than a downstream addon build. `test/money.property.test.ts`
shows the same loop for addon logic: `tstl/addon/money.ts` is property-tested in
Node and compiled to Lua by the same build.

## Protected APIs

Functions the client marks `HasRestrictions` only run from secure execution
paths, which cannot be proven statically. The TSTL plugin in
[`tstl/plugins/protected-call-guard.cjs`](tstl/plugins/protected-call-guard.cjs)
reads `generated/<release>/protected.json` and fails the Lua build on a call to
a protected API unless the statement carries a `// wow-secure` comment, forcing
the author to acknowledge each such call site. Set `WOW_RELEASE` to pick which
release's protected list the guard enforces (default `12.1.x`).
