import fc from "fast-check";
import { describe, expect, it } from "bun:test";

import {
  fieldType,
  isValidIdentifier,
  mapType,
  safeMemberName,
  safeParamName,
  type TypeContext,
} from "../src/typemap.js";
import { fieldArb } from "./arbitraries.js";

const RESERVED = new Set([
  "function", "new", "default", "in", "for", "if", "else", "return", "var",
  "let", "const", "class", "enum", "typeof", "void", "yield", "await",
]);

function emptyContext(): TypeContext {
  return { enums: new Set(), structures: new Set(), objects: new Set() };
}

describe("safeParamName", () => {
  it("always yields a valid, non-reserved identifier", () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        const safe = safeParamName(raw);
        expect(isValidIdentifier(safe)).toBe(true);
        expect(RESERVED.has(safe)).toBe(false);
      }),
    );
  });
});

describe("safeMemberName", () => {
  it("yields either a bare identifier or a quoted string literal", () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        const safe = safeMemberName(raw);
        const bare = isValidIdentifier(safe);
        const quoted = safe.startsWith('"') && safe.endsWith('"');
        expect(bare || quoted).toBe(true);
      }),
    );
  });
});

describe("mapType", () => {
  it("never throws and never returns an empty type for any field", () => {
    fc.assert(
      fc.property(fieldArb, (field) => {
        const ctx = emptyContext();
        const type = mapType(field, ctx);
        expect(type.length).toBeGreaterThan(0);
      }),
    );
  });

  it("records an unknown named type as an opaque object reference", () => {
    const ctx = emptyContext();
    const type = mapType({ Type: "TotallyMadeUpHandle" }, ctx);
    expect(type).toBe("WowObject.TotallyMadeUpHandle");
    expect(ctx.objects.has("TotallyMadeUpHandle")).toBe(true);
  });

  it("resolves a name to its enum or structure namespace by registry", () => {
    const ctx: TypeContext = {
      enums: new Set(["ItemQuality"]),
      structures: new Set(["ItemKey"]),
      objects: new Set(),
    };
    expect(mapType({ Type: "ItemQuality" }, ctx)).toBe("Enum.ItemQuality");
    expect(mapType({ Type: "ItemKey" }, ctx)).toBe("WowStruct.ItemKey");
  });

  it("maps a table with an InnerType to an array of the element type", () => {
    const ctx = emptyContext();
    expect(mapType({ Type: "table", InnerType: "number" }, ctx)).toBe("number[]");
    expect(mapType({ Type: "table", InnerType: "luaFunction" }, ctx)).toBe(
      "((...args: any[]) => any)[]",
    );
  });
});

describe("fieldType", () => {
  it("adds `| undefined` exactly when the field is nilable", () => {
    fc.assert(
      fc.property(fieldArb, (field) => {
        const ctx = emptyContext();
        const withNil = fieldType({ ...field, Nilable: true }, ctx);
        const withoutNil = fieldType({ ...field, Nilable: false }, ctx);
        expect(withNil.endsWith("| undefined")).toBe(true);
        expect(withoutNil.endsWith("| undefined")).toBe(false);
      }),
    );
  });
});
