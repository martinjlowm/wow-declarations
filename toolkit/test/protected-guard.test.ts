import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

import { buildProgram } from "./typecheck.js";

// The guard ships as a CommonJS TSTL plugin; load it through require.
const require = createRequire(import.meta.url);
const guard = require("../tstl/plugins/protected-call-guard.cjs") as {
  scan: (program: unknown, protectedNames: Set<string>) => { messageText: string }[];
  loadProtectedNames: (releaseId: string) => Set<string>;
};

const PROTECTED = new Set(["C_AuctionHouse.CancelAuction"]);

const API = `declare namespace C_AuctionHouse {\n  function CancelAuction(id: number): void;\n  function GetNumOwnedAuctions(): number;\n}\n`;

function scanSource(body: string) {
  const program = buildProgram({ "api.d.ts": API, "addon.ts": body });
  return guard.scan(program, PROTECTED);
}

describe("protected-call-guard", () => {
  it("flags an unacknowledged protected call", () => {
    const diagnostics = scanSource(`C_AuctionHouse.CancelAuction(1);\n`);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].messageText).toContain("C_AuctionHouse.CancelAuction");
  });

  it("allows the call when the statement is marked wow-secure", () => {
    const diagnostics = scanSource(`// wow-secure: from the auction OnClick\nC_AuctionHouse.CancelAuction(1);\n`);
    expect(diagnostics).toHaveLength(0);
  });

  it("ignores non-protected calls in the same namespace", () => {
    const diagnostics = scanSource(`const n = C_AuctionHouse.GetNumOwnedAuctions();\n`);
    expect(diagnostics).toHaveLength(0);
  });

  it("loads the generated protected list for a real release", () => {
    const names = guard.loadProtectedNames("12.1.x") as Set<string>;
    expect(names.has("C_AuctionHouse.PostItem")).toBe(true);
  });
});
