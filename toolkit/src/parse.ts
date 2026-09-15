import luaparse from "luaparse";

import type { DocSystem } from "./model.js";

// The doc files are pure Lua data: `local X = { ... }` followed by
// `APIDocumentation:AddDocumentationTable(X)`. We parse to an AST and read the
// table literal off it rather than evaluating Lua, so no VM is needed and the
// parse can never run code from the upstream repo.

type LuaNode = Record<string, any>;

const LUA_ESCAPES: Record<string, string> = {
  a: "\x07", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v",
  "\\": "\\", '"': '"', "'": "'", "\n": "\n",
};

/** Decode a Lua 5.1 string token (raw, with delimiters) to its value. */
export function decodeLuaString(raw: string): string {
  // Long-bracket form [[...]] / [==[...]==] carries no escapes.
  const long = raw.match(/^\[(=*)\[([\s\S]*)\]\1\]$/);
  if (long) return long[2].replace(/^\n/, "");
  const inner = raw.slice(1, -1); // strip the surrounding quote
  let out = "";
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] !== "\\") {
      out += inner[i];
      continue;
    }
    const next = inner[++i];
    if (next >= "0" && next <= "9") {
      let digits = next;
      while (digits.length < 3 && inner[i + 1] >= "0" && inner[i + 1] <= "9") digits += inner[++i];
      out += String.fromCharCode(parseInt(digits, 10));
    } else if (next === "x") {
      const hex = inner.slice(i + 1, i + 3);
      i += 2;
      out += String.fromCharCode(parseInt(hex, 16));
    } else {
      out += LUA_ESCAPES[next] ?? next;
    }
  }
  return out;
}

function literalValue(node: LuaNode): unknown {
  switch (node.type) {
    case "StringLiteral":
      // luaparse 0.3 leaves `value` null and keeps the escaped token in `raw`.
      if (typeof node.value === "string") return node.value;
      return decodeLuaString(String(node.raw));
    case "NumericLiteral":
      return node.value;
    case "BooleanLiteral":
      return node.value;
    case "NilLiteral":
      return undefined;
    case "UnaryExpression":
      if (node.operator === "-") return -(literalValue(node.argument) as number);
      return literalValue(node.argument);
    case "TableConstructorExpression":
      return tableValue(node);
    case "Identifier":
      // Enum member self-references and the like; keep the name as a string.
      return node.name;
    default:
      return undefined;
  }
}

function tableValue(node: LuaNode): unknown {
  const fields = node.fields ?? [];
  // An empty Lua table is ambiguous; every empty table in the doc model is a
  // list slot (Functions/Tables/Arguments/...), never an empty record, so
  // default to an array.
  const isArray = fields.length === 0 || fields.every((f: LuaNode) => f.type === "TableValue");
  if (isArray) {
    return fields.map((f: LuaNode) => literalValue(f.value));
  }
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === "TableKeyString") {
      out[field.key.name] = literalValue(field.value);
    } else if (field.type === "TableKey") {
      const key = literalValue(field.key);
      out[String(key)] = literalValue(field.value);
    } else if (field.type === "TableValue") {
      // Mixed table; index positional entries after named ones.
      out[String(Object.keys(out).length)] = literalValue(field.value);
    }
  }
  return out;
}

/** Parse one *Documentation.lua file into its DocSystem table. */
export function parseDocFile(source: string): DocSystem {
  const ast = luaparse.parse(source, { luaVersion: "5.1", comments: false }) as LuaNode;

  const locals = new Map<string, LuaNode>();
  let registered: string | undefined;

  for (const statement of ast.body as LuaNode[]) {
    if (statement.type === "LocalStatement") {
      const name = statement.variables?.[0]?.name;
      const init = statement.init?.[0];
      if (name && init?.type === "TableConstructorExpression") {
        locals.set(name, init);
      }
    } else if (statement.type === "CallStatement") {
      const call = statement.expression;
      const callee = call?.base;
      // Matches APIDocumentation:AddDocumentationTable(X)
      if (callee?.type === "IndexExpression" || callee?.type === "MemberExpression") {
        const method = callee.identifier?.name;
        if (method === "AddDocumentationTable" && call.arguments?.[0]?.type === "Identifier") {
          registered = call.arguments[0].name;
        }
      }
    }
  }

  const target = (registered && locals.get(registered)) || [...locals.values()][0];
  if (!target) {
    throw new Error("no documentation table found in source");
  }
  return tableValue(target) as DocSystem;
}
