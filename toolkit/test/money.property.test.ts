import fc from "fast-check";
import { describe, expect, it } from "bun:test";

import { copperToParts, formatMoney, partsToCopper } from "../tstl/addon/money.js";

// Property/fuzz coverage for the shared addon logic. The same money.ts compiles
// to Lua for the addon; testing it here is the fast Node-side feedback loop.

const copperArb = fc.integer({ min: 0, max: 2 ** 31 });

describe("copperToParts / partsToCopper", () => {
  it("round-trips any whole copper amount", () => {
    fc.assert(
      fc.property(copperArb, (copper) => {
        expect(partsToCopper(copperToParts(copper))).toBe(copper);
      }),
    );
  });

  it("keeps silver and copper within a single unit", () => {
    fc.assert(
      fc.property(copperArb, (copper) => {
        const { silver, copper: c } = copperToParts(copper);
        expect(silver).toBeGreaterThanOrEqual(0);
        expect(silver).toBeLessThan(100);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThan(100);
      }),
    );
  });

  it("floors fractional or negative input to a non-negative amount", () => {
    fc.assert(
      fc.property(fc.double({ min: -1000, max: 1000, noNaN: true }), (copper) => {
        expect(partsToCopper(copperToParts(copper))).toBe(Math.max(0, Math.floor(copper)));
      }),
    );
  });
});

describe("formatMoney", () => {
  it("always ends in a copper segment and drops leading zero units", () => {
    fc.assert(
      fc.property(copperArb, (copper) => {
        const text = formatMoney(copper);
        expect(text.endsWith("c")).toBe(true);
        // No gold means no gold segment; no gold and no silver means copper only.
        const { gold, silver } = copperToParts(copper);
        if (gold === 0) expect(text.includes("g")).toBe(false);
        if (gold === 0 && silver === 0) expect(text).toBe(`${copperToParts(copper).copper}c`);
      }),
    );
  });
});
