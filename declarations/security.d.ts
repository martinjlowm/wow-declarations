/** @noSelfInFile */

/// <reference path='./global.d.ts' />

/**
 * Determines whether the current execution path is secure
 *
 * @returns 1 if the current path is secure (and able to call protected functions), nil otherwise.
 * @see https://wow.gamepedia.com/API_issecure
 */
declare function issecure(): WoWAPI.Flag;

/**
 * Taints the current execution path.
 *
 * @see https://wow.gamepedia.com/API_forceinsecure
 * @since 3.0.2
 */
declare function forceinsecure(): void;

/**
 * Determines whether the given table key is secure
 *
 * @param table table to check the the key in; if omitted, defaults to the globals table (_G).
 * @param variableName string key to check the taint of. Numbers will be converted to a string; other types will throw an error
 * @returns isSecure, taint
 * @see https://wow.gamepedia.com/API_issecurevariable
 * @tupleReturn
 */
declare function issecurevariable(table?: object, variableName?: string): [boolean, string];

/**
 * Calls the specified function without propagating taint to the caller
 *
 * @param call function to call, either a direct reference or a string used as a key into _G.
 * @param args any number of arguments to pass the function
 * @returns the function's return values
 * @see https://wow.gamepedia.com/API_securecall
 */
declare function securecall(call: string | ((...args: any[]) => any), ...args: any[]): any;

/**
 * Creates a secure "post hook" for the specified function. Your hook will be called with the same arguments after the original call is performed
 *
 * @param table Table to hook the functionName key in; if omitted, defaults to the global table (_G).
 * @param functionName name of the function being hooked
 * @param handler your hook function
 * @see https://wow.gamepedia.com/API_hooksecurefunc
 */
declare function hooksecurefunc(table?: object, functionName?: string, handler?: (...args: any[]) => any): void;

/**
 * Determines whether in-combat lockdown restrictions are active
 *
 * @returns true if lockdown restrictions are currently in effect, false otherwise
 * @see https://wow.gamepedia.com/API_InCombatLockdown
 */
declare function InCombatLockdown(): boolean;

/**
 * The generic state driver for any frame -- you can register to be notified
 * when an arbitrary macro conditional evaluates to a different values. Updates
 * are delivered via attributes; handle OnAttributeChanged or use
 * SecureHandlerStateTemplate with a corresponding snippet to respond from a
 * restricted environment. Repeated calls with the same frame and stateid will
 * overwrite previous ones.
 *
 * @param frame Frame-derived widget - notifications will be delivered by
 *   setting attributes on this frame.
 * @param stateId String - an arbitrary identifier string for this conditional
 *   (coerced to lower case), or "visibility". The latter is a special state --
 *   rather than delivering an update through attribute changes, it shows or
 *   hides the frame when the conditional evaluates to "show" or "hide"
 *   respectively.
 * @param conditional String - macro conditional parsable by
 *   SecureCmdOptionParse. The value this conditional evaluates to will be set
 *   as the value of the "state-stateid" attribute on the frame.
 * @see https://wow.gamepedia.com/SecureStateDriver
 */
declare function RegisterStateDriver(frame: WoWAPI.Frame, stateId: string, conditional: string): void;

/**
 * Cancels a previous generic state driver for the given frame and stateid.
 *
 * @param frame Frame-derived widget - notifications will be delivered by
 *   setting attributes on this frame.
 * @param stateId String - an arbitrary identifier string for this conditional
 *   (coerced to lower case), or "visibility". The latter is a special state --
 *   rather than delivering an update through attribute changes, it shows or
 *   hides the frame when the conditional evaluates to "show" or "hide"
 *   respectively.
 * @see https://wow.gamepedia.com/SecureStateDriver
 */
declare function UnregisterStateDriver(frame: WoWAPI.Frame, state: string, conditional: string): void;

/**
 * Assists in controlling unit frames -- can either show/hide the frame based on
 * whether its unit exists; or deliver that information via a state attribute.
 *
 * @param frame Frame-derived widget - The frame to be shown/hidden/notified
 *   when its unit exists / does not exist.
 * @param asState Boolean - if true, the "state-unitexists" attribute will be
 *   set to a boolean value denoting whether the unit exists; if false, the
 *   frame will be shown if its unit exists, and hidden if it does not.
 * @see https://wow.gamepedia.com/SecureStateDriver
 */
declare function RegisterUnitWatch(frame: WoWAPI.Frame, asState: boolean): void;

/**
 * Cancels a previous generic state driver for the given frame and stateid.
 *
 * @param frame Frame-derived widget - The frame to be shown/hidden/notified
 *   when its unit exists / does not exist.
 * @param asState Boolean - if true, the "state-unitexists" attribute will be
 *   set to a boolean value denoting whether the unit exists; if false, the
 *   frame will be shown if its unit exists, and hidden if it does not.
 * @see https://wow.gamepedia.com/SecureStateDriver
 */
declare function UnregisterUnitWatch(frame: WoWAPI.Frame, asState: boolean): void;
