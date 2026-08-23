"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The Comms audio page, embedded.
 *
 * Our copy of Comms is served from this site, so the iframe is same-origin and
 * the room page can reach into it. Comms builds its group buttons with a global
 * `drawGroup(id)` that returns early if the button already exists; calling it
 * whenever the side-room list changes is how a side room added on one phone
 * appears as a button on everyone else's without reconnecting.
 *
 * The `src` must never change while mounted -- a new src reloads the frame and
 * drops the call. The caller freezes it when the person joins.
 */

type Props = {
  src: string;
  /** Every group the frame should have a button for. Safe to repeat. */
  groupIds: string[];
  fullscreen: boolean;
  title: string;
};

type CommsWindow = Window & { drawGroup?: (id: string) => unknown };

/**
 * What the inner VDO.Ninja frame may ask for, delegated through this one.
 * Comms grants the same set to its own iframe; a permission missing at either
 * level would make the microphone prompt fail silently.
 */
const ALLOW =
  "microphone; autoplay; screen-wake-lock; fullscreen; picture-in-picture; display-capture";

export function CommsFrame({ src, groupIds, fullscreen, title }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    let win: CommsWindow | null = null;
    try {
      win = frame.current?.contentWindow as CommsWindow | null;
    } catch {
      // Cross-origin: NEXT_PUBLIC_COMMS_URL points at upstream Comms. The
      // call still works; new side rooms just need the "+" button there.
      return;
    }
    if (!win || typeof win.drawGroup !== "function") return;
    for (const id of groupIds) {
      try {
        win.drawGroup(id);
      } catch (error) {
        console.error("[noisy-room] could not add group button:", error);
      }
    }
  }, [loaded, groupIds]);

  return (
    <iframe
      ref={frame}
      src={src}
      title={title}
      allow={ALLOW}
      onLoad={() => setLoaded(true)}
      // Same element in both layouts -- only the classes change -- so going
      // full screen never reloads the call.
      className={
        fullscreen
          ? "h-full w-full flex-1 border-0 bg-[#2e445c]"
          : "h-[min(70vh,40rem)] w-full rounded-lg border-0 bg-[#2e445c]"
      }
    />
  );
}
