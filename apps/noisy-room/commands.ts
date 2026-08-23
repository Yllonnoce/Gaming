import { clampMicGain } from "./names.ts";

/**
 * Messages posted into the VDO.Ninja frame that have no first-class command.
 *
 * VDO.Ninja's iframe API includes `{function: "eval"}`, which runs code inside
 * the frame. It is how we reach `changeMainGain`, the exact function the
 * engine's own settings slider calls, since there is no documented gain
 * command. The string is pinned by a test: if VDO.Ninja ever renames the
 * function the slider would fail silently mid-call, and the test is where
 * that dependency is written down.
 */

export const MIC_GAIN_FUNCTION = "changeMainGain";

export function micGainCommand(percent: number): { function: "eval"; value: string } {
  return { function: "eval", value: `${MIC_GAIN_FUNCTION}(${clampMicGain(percent)})` };
}

/** Ask the engine for its microphones and speakers; it replies with {deviceList}. */
export const DEVICE_LIST_COMMAND = { getDeviceList: true } as const;

/**
 * Device ids are opaque browser tokens (hex, base64, or the words "default"
 * and "communications"). Anything outside that alphabet is refused rather
 * than interpolated into code that runs inside the frame.
 */
export const DEVICE_ID_PATTERN = /^[A-Za-z0-9+/=_.:-]{1,256}$/;

export function isDeviceId(value: string): boolean {
  return DEVICE_ID_PATTERN.test(value);
}

/** Switch the microphone. changeAudioDeviceById is what the director's remote control uses. */
export function micDeviceCommand(deviceId: string): { function: "eval"; value: string } | null {
  if (!isDeviceId(deviceId)) return null;
  return { function: "eval", value: `changeAudioDeviceById(${JSON.stringify(deviceId)})` };
}

/** Switch the speaker. This one has a first-class command. */
export function speakerDeviceCommand(deviceId: string): { changeAudioOutputDevice: string } | null {
  if (!isDeviceId(deviceId)) return null;
  return { changeAudioOutputDevice: deviceId };
}

/** The key the engine replies under when asked which devices are live. */
export const CURRENT_DEVICES_KEY = "noisyRoomDevices";

/**
 * Which microphone and speaker are actually in use. Read from the live audio
 * track and the chosen sink, posted back to us under CURRENT_DEVICES_KEY.
 */
export const CURRENT_DEVICES_COMMAND = {
  function: "eval",
  value:
    "(function(){" +
    "var t=session.streamSrc&&session.streamSrc.getAudioTracks&&session.streamSrc.getAudioTracks()[0];" +
    "var s=t&&t.getSettings?t.getSettings():{};" +
    `parent.postMessage({${CURRENT_DEVICES_KEY}:{mic:s.deviceId||null,speaker:session.sink||null}},'*');` +
    "})()",
} as const;

export type AudioDevice = { deviceId: string; label: string };
export type DeviceLists = { mics: AudioDevice[]; speakers: AudioDevice[] };

/**
 * Shape the engine's device list into two clean menus. Labels are empty until
 * the microphone has been granted, so there is always a fallback name.
 */
export function parseDeviceList(list: unknown): DeviceLists {
  const result: DeviceLists = { mics: [], speakers: [] };
  if (!Array.isArray(list)) return result;
  const seen = new Set<string>();
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const { deviceId, kind, label } = entry as Record<string, unknown>;
    if (typeof deviceId !== "string" || !isDeviceId(deviceId)) continue;
    const bucket = kind === "audioinput" ? result.mics : kind === "audiooutput" ? result.speakers : null;
    if (!bucket) continue;
    const key = `${kind}:${deviceId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const name = typeof label === "string" && label.trim() ? label.trim() : "";
    bucket.push({
      deviceId,
      label: name || `${kind === "audioinput" ? "Microphone" : "Speaker"} ${bucket.length + 1}`,
    });
  }
  return result;
}
