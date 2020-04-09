/** @noSelfInFile */

/**
 * Returns the name and realm of the specified unit
 * @param unitId The UnitId to query (e.g. "player", "party2", "pet", "target" etc.)
 * @see https://wow.gamepedia.com/API_UnitName
 */
declare function UnitName(unitId: WoWAPI.UnitId): string;

declare function UnitXP(unitId: WoWAPI.UnitId): number;
declare function UnitXPMax(unitId: WoWAPI.UnitId): number;
