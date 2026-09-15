import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { collectProtected, emitRelease } from "./emit.js";
import { readDocFiles } from "./fetch.js";
import type { DocSystem } from "./model.js";
import { parseDocFile } from "./parse.js";
import { RELEASES, type Release, findRelease } from "./releases.js";

// Repo root is one level above toolkit/.
const ROOT = new URL("../../", import.meta.url).pathname;

function tsconfigFor(release: Release): string {
  // A release-specific project: the hand-written base declarations plus this
  // release's generated types, targeting the Lua-facing toolchain.
  return (
    JSON.stringify(
      {
        $schema: "https://json.schemastore.org/tsconfig",
        extends: "./tsconfig.base.json",
        compilerOptions: {
          // WoW runs Lua 5.1 and TypeScriptToLua drives the emit, so target the
          // Lua-facing toolchain rather than the base's Node-oriented defaults.
          module: "esnext",
          moduleResolution: "bundler",
          // The base declarations import through an "@/" alias; map it so a
          // release build resolves them. baseUrl is deprecated in TS 6 but the
          // legacy TS 3.8 base still needs it for paths, so silence it here.
          baseUrl: ".",
          paths: { "@/*": ["declarations/*"] },
          ignoreDeprecations: "6.0",
          types: ["lua-types/5.1", "@typescript-to-lua/language-extensions"],
          target: "esnext",
          lib: ["esnext"],
          removeComments: false,
        },
        include: [`generated/${release.id}/**/*.d.ts`, "declarations/**/*.d.ts"],
        // The generated C_* namespaces supersede the two C_ tables the base
        // hand-wrote before this generator existed; a const and a namespace of
        // the same name cannot merge, so drop the hand-written pair. The legacy
        // aggregate index re-imports them, so it is dropped too; the other base
        // files are ambient globals that still load through the include glob,
        // and generated/<id>/index.d.ts is this release's entry point.
        exclude: [
          "declarations/index.d.ts",
          "declarations/chat-info.d.ts",
          "declarations/black-market.d.ts",
        ],
      },
      null,
      2,
    ) + "\n"
  );
}

function generateRelease(release: Release): void {
  console.log(`\n» ${release.id} (${release.label} ${release.version})`);
  const systems: DocSystem[] = [];
  let parseFailures = 0;
  for (const file of readDocFiles(release)) {
    try {
      systems.push(parseDocFile(file.source));
    } catch (error) {
      parseFailures++;
      console.warn(`  ! failed to parse ${file.name}: ${(error as Error).message}`);
    }
  }

  const result = emitRelease(systems, release);
  const outDir = join(ROOT, "generated", release.id);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  for (const [name, content] of Object.entries(result.files)) {
    writeFileSync(join(outDir, name), content);
  }
  writeFileSync(join(outDir, "protected.json"), JSON.stringify(collectProtected(systems), null, 2) + "\n");
  writeFileSync(join(ROOT, `tsconfig.${release.id}.json`), tsconfigFor(release));

  const s = result.stats;
  console.log(
    `  parsed ${systems.length} systems (${parseFailures} failed), ` +
      `${s.functions} functions (${s.protectedFunctions} protected), ${s.events} events, ` +
      `${s.enums} enums, ${s.structures} structures, ${s.objects} objects`,
  );
}

function main(): void {
  const requested = process.argv.slice(2);
  const releases = requested.length
    ? requested.map((id) => {
        const r = findRelease(id);
        if (!r) throw new Error(`unknown release ${id}; known: ${RELEASES.map((x) => x.id).join(", ")}`);
        return r;
      })
    : RELEASES;
  for (const release of releases) generateRelease(release);
}

main();
