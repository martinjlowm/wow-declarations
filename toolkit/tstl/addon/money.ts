// Pure gold/silver/copper helpers. No WoW globals, so vitest + fast-check can
// drive them in the fast Node loop, and TypeScriptToLua compiles the same
// source into the addon's Lua. This is the shared logic the property suite and
// the Lua build both consume.

export interface MoneyParts {
  gold: number;
  silver: number;
  copper: number;
}

const COPPER_PER_SILVER = 100;
const COPPER_PER_GOLD = 100 * 100;

/** Split a non-negative copper amount into gold/silver/copper. */
export function copperToParts(copper: number): MoneyParts {
  const whole = Math.max(0, Math.floor(copper));
  return {
    gold: Math.floor(whole / COPPER_PER_GOLD),
    silver: Math.floor((whole % COPPER_PER_GOLD) / COPPER_PER_SILVER),
    copper: whole % COPPER_PER_SILVER,
  };
}

/** Recombine parts back into a total copper amount. */
export function partsToCopper(parts: MoneyParts): number {
  return parts.gold * COPPER_PER_GOLD + parts.silver * COPPER_PER_SILVER + parts.copper;
}

/** Render a copper amount as e.g. "12g 3s 45c", dropping leading zero units. */
export function formatMoney(copper: number): string {
  const { gold, silver, copper: c } = copperToParts(copper);
  const segments: string[] = [];
  if (gold > 0) segments.push(`${gold}g`);
  if (gold > 0 || silver > 0) segments.push(`${silver}s`);
  segments.push(`${c}c`);
  return segments.join(" ");
}
