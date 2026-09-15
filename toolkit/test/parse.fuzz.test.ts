import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { decodeLuaString, parseDocFile } from "../src/parse.js";
import { systemArb } from "./arbitraries.js";

// Serialize a JS value back into the Lua table syntax the doc files use, so we
// can fuzz the parser with a round trip: serialize(x) then parse should recover
// x. This exercises escaping, nesting, arrays vs records and numeric values.

function luaString(s: string): string {
  const escaped = s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    // Remaining control chars as decimal escapes.
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, (c) => `\\${c.charCodeAt(0)}`);
  return `"${escaped}"`;
}

function serialize(value: unknown): string {
  if (typeof value === "string") return luaString(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `{ ${value.map(serialize).join(", ")} }`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    return `{ ${entries.map(([k, v]) => `["${k}"] = ${serialize(v)}`).join(", ")} }`;
  }
  return "nil";
}

function toDocFile(system: unknown): string {
  return `local T = ${serialize(system)}\nAPIDocumentation:AddDocumentationTable(T);\n`;
}

// Drop undefined-valued keys the way the serializer does, for comparison.
function prune(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(prune);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = prune(v);
    }
    return out;
  }
  return value;
}

describe("decodeLuaString", () => {
  it("recovers escapes and long-bracket strings", () => {
    expect(decodeLuaString('"a\\tb"')).toBe("a\tb");
    expect(decodeLuaString('"quote \\" here"')).toBe('quote " here');
    expect(decodeLuaString('"\\65\\66"')).toBe("AB");
    expect(decodeLuaString("[[\nraw \\t text]]")).toBe("raw \\t text");
  });
});

describe("parseDocFile round trip", () => {
  it("recovers any serialized documentation system", () => {
    fc.assert(
      fc.property(systemArb, (system) => {
        const parsed = parseDocFile(toDocFile(system));
        expect(parsed).toEqual(prune(system));
      }),
      { numRuns: 100 },
    );
  });

  it("throws a clean error on non-table garbage rather than hanging", () => {
    fc.assert(
      fc.property(fc.string(), (garbage) => {
        try {
          parseDocFile(garbage);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }),
      { numRuns: 60 },
    );
  });
});
