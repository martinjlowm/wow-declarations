// Sample addon entry. Uses the generated C_AuctionHouse namespace, the generated
// event payload map, a Lua global (print) and the shared money helpers, and
// TypeScriptToLua compiles it to WoW-ready Lua 5.1. The protected call shows the
// guard: it builds only because the statement is acknowledged as secure.

import { formatMoney } from "./money";

/** Non-protected read: estimate and print a commodity deposit. */
export function reportDeposit(itemID: number, duration: number, quantity: number): void {
  const deposit = C_AuctionHouse.CalculateCommodityDeposit(itemID, duration, quantity);
  if (deposit !== undefined) {
    print(`Deposit: ${formatMoney(deposit)}`);
  }
}

/** Protected write: cancelling an auction only runs from secure code. */
export function cancelFromSecureHandler(ownedAuctionID: number): void {
  // wow-secure: reached from the auction frame's OnClick, a hardware event.
  C_AuctionHouse.CancelAuction(ownedAuctionID);
}

/** Event names are typed by the generated payload map. */
export function describeEvent(event: WowEvent.Name): string {
  return `handling ${event}`;
}
