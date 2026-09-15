/** @noSelfInFile */

declare namespace WoWAPI {
  // AddonMessageType and the other chat string enums moved to event.d.ts so a
  // release build can drop this file (superseded by the generated C_ChatInfo
  // namespace) without losing them. Both files merge into WoWAPI in the legacy
  // builds that still include this one.
  interface C_ChatInfo {
    /**
     * Registers an addon message prefix, allowing messages sent over addon channels with that prefix to be received by the client
     * @param prefix The message prefix to register for delivery
     * @see https://wow.gamepedia.com/API_RegisterAddonMessagePrefix
     */
    RegisterAddonMessagePrefix(this: C_ChatInfo, prefix: string): void;

    /**
     * Sends a message to the hidden addon channel
     * @param prefix Message prefix, can be used as your addon identifier; at most 15 characters
     * @param text Text to send, at most 250 characters
     * @param type AddOn channel to send to. Valid types are "PARTY", "RAID", "GUILD", "BATTLEGROUND", "WHISPER", and "CHANNEL".
     * @since 1.12.0
     */
    SendAddonMessage(
      this: C_ChatInfo,
      prefix: string,
      text: string,
      type: Exclude<AddonMessageType, 'WHISPER' | 'CHANNEL'>,
    ): void;

    /**
     * Sends a message to the hidden addon channel
     * @param prefix Message prefix, can be used as your addon identifier; at most 15 characters
     * @param text Text to send, at most 250 characters
     * @param type AddOn channel to send to. Valid types are "PARTY", "RAID", "GUILD", "BATTLEGROUND", "WHISPER", and "CHANNEL".
     * @param target sed only for "WHISPER" and "CHANNEL" communications - the player to whisper to for "WHISPER" or the channel name to
     * broadcast to for "CHANNEL"
     * @since 2.1.0
     */
    SendAddonMessage(this: C_ChatInfo, prefix: string, text: string, type: 'WHISPER' | 'CHANNEL', target: string): void;
  }
}

declare const C_ChatInfo: WoWAPI.C_ChatInfo;
