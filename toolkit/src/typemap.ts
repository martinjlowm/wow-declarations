import type { DocField } from "./model.js";

// Maps a Blizzard documentation type to a TypeScript type. Pure and free of I/O
// so the property and fuzz suites can drive it with generated input. The only
// context it needs is which names are enums vs structures vs opaque objects,
// which the generator collects up front from every Tables entry.

export interface TypeContext {
  enums: ReadonlySet<string>;
  structures: ReadonlySet<string>;
  /** Object/handle names referenced by signatures but not defined as tables. */
  objects: Set<string>;
}

// Blizzard scalar types that collapse to a TS primitive. Names are exactly as
// they appear in the docs (case-sensitive).
const SCALARS: Record<string, string> = {
  bool: "boolean",
  cstring: "string",
  string: "string",
  number: "number",
  luaIndex: "number",
  luaFloat: "number",
  luaNumber: "number",
  time_t: "number",
  uiUnit: "number",
  uiFontHeight: "number",
  BigInteger: "number",
  BigUInteger: "number",
  WOWMONEY: "number",
  fileID: "number",
  FileID: "number",
  textureAtlas: "string",
  normalizedStringLiteral: "string",
  WOWGUID: "string",
  WOWTICKET: "string",
  luaFunction: "(...args: any[]) => any",
  luaTable: "AnyTable",
  table: "AnyTable",
  ColorRGB: "AnyTable",
  kstringLootHistoryItem: "string",
};

const RESERVED = new Set([
  "function", "new", "default", "in", "for", "if", "else", "return", "var",
  "let", "const", "class", "extends", "super", "this", "void", "typeof",
  "instanceof", "delete", "do", "while", "switch", "case", "break", "continue",
  "with", "debugger", "export", "import", "enum", "yield", "await", "arguments",
]);

export function isValidIdentifier(name: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

/** Make a documented argument name safe to use as a TS parameter binding. */
export function safeParamName(name: string): string {
  let out = name.replace(/[^A-Za-z0-9_$]/g, "_");
  if (!/^[A-Za-z_$]/.test(out)) out = `_${out}`;
  if (RESERVED.has(out)) out = `${out}_`;
  return out;
}

/** Make a struct field / enum member name safe, quoting when it cannot be bare. */
export function safeMemberName(name: string): string {
  return isValidIdentifier(name) ? name : JSON.stringify(name);
}

/** Resolve a single named type (no table/nilable handling) to a TS type. */
function mapNamed(type: string, ctx: TypeContext): string {
  if (type in SCALARS) return SCALARS[type];
  if (ctx.enums.has(type)) return `Enum.${type}`;
  if (ctx.structures.has(type)) return `WowStruct.${type}`;
  // Unknown name: a UI object or handle. Record it so the emitter can declare a
  // nominal placeholder, and reference it by that name.
  ctx.objects.add(type);
  return `WowObject.${type}`;
}

/** Map a field's Type (+ InnerType) to a TS type, ignoring nilability. */
export function mapType(field: Pick<DocField, "Type" | "InnerType">, ctx: TypeContext): string {
  const base = field.Type;
  if ((base === "table" || base === "luaTable") && field.InnerType) {
    const inner = mapNamed(field.InnerType, ctx);
    return `${wrapArrayElement(inner)}[]`;
  }
  return mapNamed(base, ctx);
}

// A union or function-type element needs parentheses before `[]`.
function wrapArrayElement(t: string): string {
  return /[|&]|=>/.test(t) ? `(${t})` : t;
}

/** A struct field's TS type, folding Nilable into a `| undefined` union. */
export function fieldType(field: DocField, ctx: TypeContext): string {
  const base = mapType(field, ctx);
  return field.Nilable ? `${base} | undefined` : base;
}
