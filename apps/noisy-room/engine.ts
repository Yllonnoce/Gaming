"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { TABLE_GROUP } from "./names";

/**
 * Driving VDO.Ninja as an audio engine.
 *
 * The engine runs in an iframe we keep out of sight. Everything the person
 * sees -- group buttons, mute, who's here -- is drawn by the room page from
 * state reported here, and every tap becomes a postMessage to the frame.
 *
 * The protocol is VDO.Ninja's iframe API. Commands in: {groups}, {groupView},
 * {mic}, {getDetailedState}. Events out arrive as {action, value} or as a
 * {detailedState} reply. Names were taken from VDO.Ninja's source rather than
 * its (partial) documentation.
 */

export type EngineStatus =
  /** Frame created; waiting for the microphone. */
  | "starting"
  /** Microphone granted and publishing; joining the room. */
  | "mic"
  /** In the room. */
  | "connected"
  /** The engine ended the call (network loss, or it was told to). */
  | "ended";

export type Peer = {
  streamID: string;
  label: string;
  groups: string[];
  muted: boolean;
};

type DetailedItem = {
  streamID?: unknown;
  label?: unknown;
  group?: unknown;
  muted?: unknown;
  /** True for the entry describing this very guest. */
  localStream?: unknown;
};

const POLL_MS = 2000;

function toPeers(state: unknown): Peer[] {
  if (!state || typeof state !== "object") return [];
  const peers: Peer[] = [];
  for (const item of Object.values(state as Record<string, DetailedItem>)) {
    if (!item || typeof item.streamID !== "string") continue;
    // The state lists us too; "who's here" means everyone else.
    if (item.localStream === true) continue;
    const group = item.group;
    peers.push({
      streamID: item.streamID,
      label: typeof item.label === "string" ? item.label : "",
      groups: Array.isArray(group) ? group.filter((g): g is string => typeof g === "string") : [],
      muted: item.muted === true,
    });
  }
  return peers.sort((a, b) => (a.label || a.streamID).localeCompare(b.label || b.streamID));
}

/**
 * @param active  Whether a call is in progress; listeners and polling run only then.
 * @param frame   The engine iframe. Owned by the caller so that what this hook
 *                returns is plain state and callbacks, never a ref.
 */
export function useAudioEngine(active: boolean, frame: RefObject<HTMLIFrameElement | null>) {
  const [status, setStatus] = useState<EngineStatus>("starting");
  const [muted, setMuted] = useState(false);
  const [groups, setGroups] = useState<string[]>([TABLE_GROUP]);
  const [peers, setPeers] = useState<Peer[]>([]);

  const post = useCallback(
    (message: Record<string, unknown>) => {
      frame.current?.contentWindow?.postMessage(message, "*");
    },
    [frame],
  );

  /** Call before starting a new call, so nothing from the last one lingers. */
  const reset = useCallback(() => {
    setStatus("starting");
    setMuted(false);
    setGroups([TABLE_GROUP]);
    setPeers([]);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onMessage = (event: MessageEvent) => {
      const source = frame.current?.contentWindow;
      if (!source || event.source !== source) return;
      const data: unknown = event.data;
      if (!data || typeof data !== "object") return;
      const message = data as { action?: unknown; value?: unknown; detailedState?: unknown };

      if ("detailedState" in message) {
        setPeers(toPeers(message.detailedState));
        return;
      }
      switch (message.action) {
        case "local-microphone-event":
          setStatus((s) => (s === "starting" ? "mic" : s));
          break;
        case "joined-room-complete":
          setStatus("connected");
          break;
        case "mic-mute-state":
          setMuted(message.value === true);
          break;
        case "group-set-updated":
          if (Array.isArray(message.value)) {
            setGroups(message.value.filter((g): g is string => typeof g === "string"));
          }
          break;
        case "hungup":
          setStatus("ended");
          break;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [active, frame]);

  // Who's here, refreshed regularly. Cheap: the reply is a small object.
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => post({ getDetailedState: true }), POLL_MS);
    return () => window.clearInterval(timer);
  }, [active, post]);

  const setTalkGroups = useCallback(
    (next: string[]) => {
      setGroups(next);
      post({ groups: next });
    },
    [post],
  );

  const setListenGroups = useCallback((next: string[]) => post({ groupView: next }), [post]);

  const setMic = useCallback(
    (on: boolean) => {
      setMuted(!on);
      post({ mic: on });
    },
    [post],
  );

  return { status, muted, groups, peers, reset, setTalkGroups, setListenGroups, setMic };
}
