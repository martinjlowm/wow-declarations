# wow-declarations toolkit

This directory generates release-specific WoW API declarations from
[Gethe/wow-ui-source](https://github.com/Gethe/wow-ui-source) and gives addon
authors a fast TypeScript feedback loop that compiles to Lua with
[TypeScriptToLua](https://github.com/TypeScriptToLua/TypeScriptToLua).

It is a standalone Yarn 4 package so it does not depend on the repository's
legacy Yarn 2 plus `ts-auto-mock` mock pipeline.

```
cd toolkit
yarn install            # Yarn 4, node-modules linker (see Toolchain below)
yarn generate           # refresh generated/<release> and tsconfig.<release>.json
yarn test               # property + fuzz suite (bun test + fast-check)
yarn build:lua          # compile the sample addon to Lua
yarn check:releases     # type-check the committed release declarations
```

## Toolchain

The setup follows FactbirdHQ/agents-mj: Yarn 4 manages packages, Bun runs the
tests and the generator, and devenv provides the tooling.

- `devenv` (`.envrc`, `devenv.nix`, `devenv.yaml`) puts Node 24, Yarn 4, Bun,
  git and treefmt on `PATH` and runs `yarn install` on shell entry. With direnv,
  `cd toolkit` is enough; otherwise run `devenv shell`.
- `.yarnrc.yml` sets `nodeLinker: node-modules`, so Yarn writes a real
  `node_modules` tree that Bun resolves dependencies from (Bun does not read
  Yarn's Plug'n'Play), and `nmMode: hardlinks-global` shares the files with other
  node-modules projects.
- Yarn 4 is vendored at `.yarn/releases/yarn-4.14.1.cjs` with a matching
  `yarnPath`, because the repository root ships a legacy Yarn 2 through its own
  `yarnPath` and Yarn merges rc files up the tree.

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

`test/` uses `fast-check` on `bun test`. The suites fuzz the parser with a
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
