// The Blizzard API documentation model, mirroring the tables that
// Blizzard_APIDocumentationGenerated ships in Gethe/wow-ui-source. Each
// *Documentation.lua file evaluates to one DocSystem and registers it with
// APIDocumentation:AddDocumentationTable. We parse that literal rather than run
// the Lua, so this is the shape the parser produces and the emitter consumes.

/** A named argument, return value, event payload field or structure field. */
export interface DocField {
  Name: string;
  Type: string;
  /** Element type when Type is "table"; Blizzard uses this for arrays. */
  InnerType?: string;
  /** true when the value may be nil (optional argument / field, nullable return). */
  Nilable?: boolean;
  /** Present on enumeration fields: the numeric value of the enum member. */
  EnumValue?: number;
  /** Documented default for an omitted argument or field. */
  Default?: string | number | boolean;
  /** Mixin backing a UI-object argument, e.g. ItemLocationMixin. */
  Mixin?: string;
  /** Free-form documentation string. */
  Documentation?: string[];
  StrideIndex?: number;
}

export interface DocFunction {
  Name: string;
  Type: "Function";
  Arguments?: DocField[];
  Returns?: DocField[];
  Documentation?: string[];
  /** Protected: only callable from secure execution paths. */
  HasRestrictions?: boolean;
  /** Blizzard's tainting annotation for secret/secure arguments. */
  SecretArguments?: string;
  SecretReturns?: string;
}

export interface DocEvent {
  Name: string;
  Type: "Event";
  /** The string the client fires, e.g. ACHIEVEMENT_EARNED. */
  LiteralName: string;
  Payload?: DocField[];
  Documentation?: string[];
}

export interface DocEnumeration {
  Name: string;
  Type: "Enumeration";
  NumValues?: number;
  MinValue?: number;
  MaxValue?: number;
  Fields: DocField[];
}

export interface DocStructure {
  Name: string;
  Type: "Structure";
  Fields: DocField[];
  Documentation?: string[];
}

export interface DocConstants {
  Name: string;
  Type: "Constants";
  Values: DocField[];
}

export interface DocCallback {
  Name: string;
  Type: "CallbackType";
  Arguments?: DocField[];
  Returns?: DocField[];
}

export type DocTable =
  | DocEnumeration
  | DocStructure
  | DocConstants
  | DocCallback
  | { Name: string; Type: string; [key: string]: unknown };

export interface DocSystem {
  Name?: string;
  Type?: string;
  /** The global table the functions hang off, e.g. C_AuctionHouse. */
  Namespace?: string;
  Environment?: string;
  Functions?: DocFunction[];
  Events?: DocEvent[];
  Tables?: DocTable[];
}
