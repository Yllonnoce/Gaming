import { DEFAULT_GROUPS, DEFAULT_MIC_GAIN, clampMicGain } from "./names.ts";

/**
 * Building the VDO.Ninja Comms link.
 *
 * Comms (https://vdo.ninja/comms.html, also served as https://comms.cam) is
 * VDO.Ninja's intercom app: audio-only by default, phone-first, with a row of
 * group buttons for choosing who you talk to. That is the entire Noisy Room
 * experience; this site only has to mint the room, hand out the link, and keep
 * the list of groups that everyone's buttons are built from.
 */

export const DEFAULT_COMMS_URL = "https://vdo.ninja/comms.html";

export type CommsLink = {
  room: string;
  /** Side room ids. The built-in groups always come first. */
  sideRooms?: string[];
  /** Display name shown beside the person's audio in Comms. */
  label?: string;
  /** Starting microphone gain in percent; 100 is VDO.Ninja's default. */
  micGain?: number;
  /** Override the Comms host, e.g. a pinned version or a self-hosted copy. */
  base?: string;
};

export function commsUrl({ room, sideRooms = [], label, micGain, base }: CommsLink): string {
  const url = new URL(base ?? process.env.NEXT_PUBLIC_COMMS_URL ?? DEFAULT_COMMS_URL);
  const params = new URLSearchParams();
  params.set("room", room);
  // `groups` (plural) only defines the buttons. The singular `group` would also
  // be passed through to the inner VDO.Ninja frame and silently join it.
  params.set("groups", [...DEFAULT_GROUPS, ...sideRooms].join(","));
  const name = label?.trim();
  if (name) params.set("label", name);
  // Comms forwards the whole query string to the VDO.Ninja frame inside it, so
  // guest-side audio options can ride along. `mediasettings` gives each person
  // their own gear menu (gain slider, auto-gain, noise suppression); without it
  // only a director may touch those.
  params.set("mediasettings", "");
  if (micGain !== undefined) {
    const gain = clampMicGain(micGain);
    if (gain !== DEFAULT_MIC_GAIN) params.set("audiogain", String(gain));
  }
  // URLSearchParams writes a valueless flag as "mediasettings="; VDO.Ninja
  // accepts both, but the bare form is what its documentation shows.
  url.search = params.toString().replace(/=(?=&|$)/g, "");
  return url.toString();
}

/** The page on this site that a QR code points at. */
export function roomPath(room: string): string {
  return `/r/${encodeURIComponent(room)}`;
}
