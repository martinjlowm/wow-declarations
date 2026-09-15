import fc from "fast-check";
import { describe, expect, it } from "bun:test";

import { buildContext, emitParams, emitRelease, emitReturns } from "../src/emit.js";
import type { DocField } from "../src/model.js";
import type { TypeContext } from "../src/typemap.js";
import { functionArb, systemArb } from "./arbitraries.js";
import { typeCheck } from "./typecheck.js";

const emptyCtx = (): TypeContext => ({ enums: new Set(), structures: new Set(), objects: new Set() });

// The four .d.ts the emitter produces are ambient global scripts; the index
// only re-imports them, so the type-check drives them directly.
function checkable(files: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, content] of Object.entries(files)) {
    if (name === "index.d.ts") continue;
    out[name] = content;
  }
  return out;
}

describe("emitRelease", () => {
  it("produces declarations that type-check for any system", () => {
    fc.assert(
      fc.property(fc.array(systemArb, { minLength: 1, maxLength: 4 }), (systems) => {
        const result = emitRelease(systems, { id: "prop", version: "0", label: "Prop" });
        const errors = typeCheck(checkable(result.files));
        if (errors.length) throw new Error(errors.slice(0, 5).join("\n"));
      }),
      { numRuns: 20 },
    );
  });
});

describe("emitReturns trailing-optional invariant", () => {
  it("never places a required tuple element after an optional one", () => {
    fc.assert(
      fc.property(fc.array(fc.record({ Name: fc.constant("v"), Type: fc.constant("number"), Nilable: fc.boolean() }), { minLength: 2, maxLength: 5 }), (returns) => {
        const out = emitReturns(returns as DocField[], emptyCtx());
        // Once an element is optional (`v?:`), no later element may be required.
        const members = out.replace(/^LuaMultiReturn<\[|\]>$/g, "").split(", ");
        let sawOptional = false;
        for (const m of members) {
          const optional = m.includes("?:");
          if (sawOptional) expect(optional || m.includes("| undefined")).toBe(true);
          sawOptional ||= optional;
        }
      }),
    );
  });
});

describe("emitParams", () => {
  it("keeps a parseable, name-unique parameter list under reserved words", () => {
    fc.assert(
      fc.property(functionArb, (fn) => {
        const params = emitParams(fn.Arguments ?? [], emptyCtx());
        const errors = typeCheck({ "p.d.ts": `declare function _f(${params}): void;` });
        if (errors.length) throw new Error(`${params}\n${errors.join("\n")}`);
      }),
      { numRuns: 30 },
    );
  });
});

describe("buildContext", () => {
  it("classifies every table as an enum or a structure, never both", () => {
    fc.assert(
      fc.property(fc.array(systemArb, { maxLength: 4 }), (systems) => {
        const { ctx } = buildContext(systems);
        for (const name of ctx.enums) expect(ctx.structures.has(name)).toBe(false);
      }),
    );
  });
});
