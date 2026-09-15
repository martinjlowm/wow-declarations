import fc from "fast-check";

import type {
  DocEnumeration,
  DocEvent,
  DocField,
  DocFunction,
  DocStructure,
  DocSystem,
} from "../src/model.js";

// Arbitraries that generate documentation shaped like the real Blizzard tables,
// including the awkward edges the emitter has to survive: reserved-word
// argument names, non-identifier field names, nilable values in any position,
// table types with and without an InnerType, and references to names that are
// neither enum nor structure.

const KNOWN_TYPES = [
  "bool", "number", "string", "cstring", "luaIndex", "WOWGUID", "WOWMONEY",
  "table", "luaFunction", "ItemLocation", "SimpleTexture", "SomeEnum", "SomeStruct",
];

// Names that stress the sanitizers: reserved words, leading digits, spaces,
// punctuation, empty.
const AWKWARD_NAMES = ["function", "new", "default", "in", "class", "1st", "a b", "x-y", "", "__proto__"];

const nameArb: fc.Arbitrary<string> = fc.oneof(
  fc.constantFrom(...AWKWARD_NAMES),
  fc.string({ minLength: 0, maxLength: 12 }),
  fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{0,10}$/),
);

const typeArb: fc.Arbitrary<string> = fc.oneof(
  fc.constantFrom(...KNOWN_TYPES),
  fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{0,10}$/),
);

export const fieldArb: fc.Arbitrary<DocField> = fc.record(
  {
    Name: nameArb,
    Type: typeArb,
    InnerType: fc.option(typeArb, { nil: undefined }),
    Nilable: fc.boolean(),
    EnumValue: fc.option(fc.integer({ min: -5, max: 50 }), { nil: undefined }),
  },
  { requiredKeys: ["Name", "Type", "Nilable"] },
);

export const functionArb: fc.Arbitrary<DocFunction> = fc.record(
  {
    Name: fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{0,14}$/),
    Type: fc.constant("Function" as const),
    Arguments: fc.array(fieldArb, { maxLength: 6 }),
    Returns: fc.array(fieldArb, { maxLength: 4 }),
    HasRestrictions: fc.boolean(),
  },
  { requiredKeys: ["Name", "Type"] },
);

export const eventArb: fc.Arbitrary<DocEvent> = fc.record(
  {
    Name: fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{0,14}$/),
    Type: fc.constant("Event" as const),
    LiteralName: fc.stringMatching(/^[A-Z][A-Z0-9_]{0,20}$/),
    Payload: fc.array(fieldArb, { maxLength: 5 }),
  },
  { requiredKeys: ["Name", "Type", "LiteralName"] },
);

const enumArb: fc.Arbitrary<DocEnumeration> = fc.record({
  Name: fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{0,12}$/),
  Type: fc.constant("Enumeration" as const),
  Fields: fc.array(
    fc.record({
      Name: nameArb,
      Type: fc.constant("number"),
      EnumValue: fc.integer({ min: -3, max: 40 }),
    }),
    { minLength: 1, maxLength: 6 },
  ),
});

const structArb: fc.Arbitrary<DocStructure> = fc.record({
  Name: fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{0,12}$/),
  Type: fc.constant("Structure" as const),
  Fields: fc.array(fieldArb, { minLength: 1, maxLength: 6 }),
});

export const systemArb: fc.Arbitrary<DocSystem> = fc.record(
  {
    Name: fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{0,12}$/),
    Type: fc.constant("System"),
    Namespace: fc.oneof(
      fc.constant(undefined),
      fc.stringMatching(/^C_[A-Za-z][A-Za-z0-9]{0,12}$/),
    ),
    Functions: fc.array(functionArb, { maxLength: 8 }),
    Events: fc.array(eventArb, { maxLength: 5 }),
    Tables: fc.array(fc.oneof(enumArb, structArb), { maxLength: 6 }),
  },
  { requiredKeys: ["Name", "Type"] },
);
