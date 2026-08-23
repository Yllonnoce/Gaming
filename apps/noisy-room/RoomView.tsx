"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button, IconButton, TextInput } from "@/components/ui";
import { QrCode } from "@/components/QrCode";
import { useAudioEngine, type EngineStatus } from "./engine";
import type { SideRoom } from "@/lib/rooms";
import { addSideRoomAction, removeSideRoomAction } from "./actions";
import { commsUrl, engineUrl, roomPath } from "./links";
import {
  DEFAULT_GROUPS,
  DEFAULT_MIC_GAIN,
  MAX_LABEL_LENGTH,
  MAX_MIC_GAIN,
  MAX_SIDE_ROOMS,
  MIC_GAIN_STEP,
  MIN_MIC_GAIN,
  TABLE_GROUP,
  clampMicGain,
  toGroupId,
} from "./names";

/**
 * The shared room page: the code to scan, the button that joins, and the list
 * of side rooms. Everyone at the table sees this same page, so it is kept
 * free of anything host-specific beyond the right to remove side rooms.
 */

type Props = {
  room: string;
  sideRooms: SideRoom[];
  /** Null when the database was unreachable; side rooms are then read-only. */
  viewerId: string | null;
  hostId: string | null;
  storageOk: boolean;
};

const NAME_KEY = "gh:noisy-room:name";
const MIC_GAIN_KEY = "gh:noisy-room:micgain";
const REFRESH_MS = 15_000;
/** Faster while in a call, since a new side room should show up promptly. */
const REFRESH_IN_CALL_MS = 8_000;

/** The call as it was started. Frozen: changing the URL would reload the frame. */
type Session = { src: string; fallback: string; name: string };

/**
 * What the engine frame may ask for, delegated from this page. Autoplay is
 * the important one: the person's tap on Join is what lets remote audio play
 * inside a frame they never touch.
 */
const ENGINE_ALLOW = "microphone; autoplay; screen-wake-lock";

const STATUS_TEXT: Record<EngineStatus, string> = {
  starting: "Waiting for the microphone…",
  mic: "Microphone on · joining…",
  connected: "Connected",
  ended: "Call ended",
};

/**
 * The visitor's name and mic level live in localStorage so they follow them
 * from room to room. Exposed as external stores rather than copied into state
 * in an effect: React reads the server snapshot while hydrating and the real
 * value immediately after, with no extra render pass of our own.
 */
function localStore(key: string, fallback: string) {
  const listeners = new Set<() => void>();
  return {
    read(): string {
      try {
        return window.localStorage.getItem(key) ?? fallback;
      } catch {
        return fallback;
      }
    },
    write(value: string) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Private mode; the value still holds for this page load via the listeners.
      }
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    server: () => fallback,
  };
}

const nameStore = localStore(NAME_KEY, "");
const micGainStore = localStore(MIC_GAIN_KEY, String(DEFAULT_MIC_GAIN));

const subscribeNothing = () => () => {};

export function RoomView({ room, sideRooms, viewerId, hostId, storageOk }: Props) {
  const router = useRouter();
  const name = useSyncExternalStore(nameStore.subscribe, nameStore.read, nameStore.server);
  const micGain = clampMicGain(
    Number(useSyncExternalStore(micGainStore.subscribe, micGainStore.read, micGainStore.server)),
  );
  // The origin is only known in the browser; null on the server and during
  // hydration, which is what the placeholder states below key off.
  const origin = useSyncExternalStore(
    subscribeNothing,
    () => window.location.origin,
    () => null,
  );
  const pageUrl = origin ? `${origin}${roomPath(room)}` : null;
  const [copied, setCopied] = useState(false);
  const [bigCode, setBigCode] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [showEngine, setShowEngine] = useState(false);
  const [hearTable, setHearTable] = useState(true);
  const engineFrame = useRef<HTMLIFrameElement>(null);
  const engine = useAudioEngine(session !== null, engineFrame);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Side rooms added from another phone show up without a manual reload.
  // Polling is plenty at this scale and needs no connection to keep alive.
  const inCall = session !== null;
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(tick, inCall ? REFRESH_IN_CALL_MS : REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, inCall]);

  // "Keep hearing the table" is a listen-only membership of the table group
  // while talking somewhere else; drop it when the table is the talk group.
  const talkGroup = engine.groups[0] ?? TABLE_GROUP;
  useEffect(() => {
    if (!session || engine.status !== "connected") return;
    engine.setListenGroups(hearTable && talkGroup !== TABLE_GROUP ? [TABLE_GROUP] : []);
    // engine is a stable bag of callbacks; listing it would re-run on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, engine.status, hearTable, talkGroup]);

  const joinUrl = useMemo(
    () => commsUrl({ room, sideRooms: sideRooms.map((s) => s.id), label: name, micGain }),
    [room, sideRooms, name, micGain],
  );

  const rememberName = (value: string) => nameStore.write(value);
  const rememberMicGain = (value: number) => micGainStore.write(String(clampMicGain(value)));
  /** During a call: remember it and apply it live. */
  const adjustMicGain = (value: number) => {
    rememberMicGain(value);
    engine.setMicGain(value);
  };

  const copyLink = async () => {
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link:", pageUrl);
    }
  };

  const shareLink = async () => {
    if (!pageUrl) return;
    try {
      await navigator.share({ title: `Noisy Room · ${room}`, url: pageUrl });
    } catch {
      // The share sheet was dismissed, or isn't available; nothing to do.
    }
  };

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const addSideRoom = () => {
    setError(null);
    const label = draft.trim();
    if (!label) return;
    startTransition(async () => {
      const result = await addSideRoomAction(room, label);
      if (result.ok) {
        setDraft("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const removeSideRoom = (id: string, label: string) => {
    if (!window.confirm(`Remove the "${label}" side room?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await removeSideRoomAction(room, id);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  };

  const join = () => {
    engine.reset();
    setSession({
      src: engineUrl({ room, label: name, micGain }),
      fallback: joinUrl,
      name: name.trim(),
    });
    setShowEngine(false);
  };

  const leave = () => {
    if (engine.status !== "ended" && !window.confirm("Leave the call?")) return;
    setSession(null);
  };

  const sideRoomIds = useMemo(() => sideRooms.map((s) => s.id), [sideRooms]);
  const allGroups = useMemo(() => [...DEFAULT_GROUPS, ...sideRoomIds], [sideRoomIds]);
  const labelFor = (id: string) => sideRooms.find((s) => s.id === id)?.label ?? id;
  const peersIn = (id: string) => engine.peers.filter((p) => p.groups.includes(id));

  const preview = toGroupId(draft);
  const isHost = viewerId !== null && viewerId === hostId;

  return (
    <div>
      <header className="mb-5 text-center">
        <p className="label-caps">Noisy Room</p>
        <h1 className="mt-1 break-all font-display text-2xl font-bold tracking-wide sm:text-3xl">
          {room}
        </h1>
      </header>

      {/* Share -------------------------------------------------------- */}
      <section className="panel mb-3 p-4">
        <h2 className="label-caps mb-3">Scan to join</h2>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => setBigCode(true)}
            className="w-44 shrink-0 rounded-lg transition hover:opacity-90"
            aria-label="Show the code full screen"
            disabled={!pageUrl}
          >
            {pageUrl ? (
              <QrCode value={pageUrl} />
            ) : (
              <div className="aspect-square animate-pulse rounded-lg bg-ink/10" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">Or send the link:</p>
            <p className="mt-1 break-all font-mono text-[0.8125rem]">{pageUrl ?? "…"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="ghost" width="auto" onClick={copyLink} disabled={!pageUrl}>
                {copied ? "Copied" : "Copy link"}
              </Button>
              {canShare && (
                <Button variant="ghost" width="auto" onClick={shareLink} disabled={!pageUrl}>
                  Share…
                </Button>
              )}
              <Button variant="ghost" width="auto" onClick={() => setBigCode(true)}>
                Big code
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Join --------------------------------------------------------- */}
      <section className="panel mb-3 p-4">
        {session ? (
          <>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="label-caps">In the call</h2>
                <p className="truncate text-sm text-muted">
                  {session.name ? `As ${session.name} · ` : ""}mic {micGain}%
                </p>
                <p
                  className={`mt-0.5 text-sm ${
                    engine.status === "connected" ? "text-accent" : "text-muted"
                  }`}
                  role="status"
                >
                  {STATUS_TEXT[engine.status]}
                  {engine.status === "connected" &&
                    ` · ${engine.peers.length === 0 ? "nobody else yet" : `${engine.peers.length} other${engine.peers.length === 1 ? "" : "s"}`}`}
                </p>
              </div>
              <Button variant="ghost" width="auto" className="py-1.5 text-xs" onClick={leave}>
                Leave
              </Button>
            </div>

            {/* Talk to --------------------------------------------------- */}
            <h3 className="mb-2 text-sm text-muted">Talking to</h3>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {allGroups.map((id) => {
                const active = talkGroup === id;
                const here = peersIn(id).length;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    disabled={engine.status === "ended"}
                    onClick={() => engine.setTalkGroups([id])}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-3 text-left font-display text-[0.9375rem] transition disabled:opacity-40 ${
                      active
                        ? "border-accent bg-accent font-bold text-on-accent"
                        : "border-muted/35 text-ink hover:border-accent/55 hover:text-accent"
                    }`}
                  >
                    <span className="truncate">{labelFor(id)}</span>
                    {here > 0 && (
                      <span
                        className={`shrink-0 rounded-full px-2 text-xs tabular-nums ${
                          active ? "bg-on-accent/20" : "bg-accent/10 text-accent"
                        }`}
                        aria-label={`${here} here`}
                      >
                        {here}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <label className="mb-4 flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={hearTable}
                onChange={(event) => setHearTable(event.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              Keep hearing the {TABLE_GROUP} while in a side room
            </label>

            {/* Mic -------------------------------------------------------- */}
            <Button
              variant={engine.muted ? "ghost" : "primary"}
              onClick={() => engine.setMic(engine.muted)}
              disabled={engine.status === "starting" || engine.status === "ended"}
              aria-pressed={engine.muted}
            >
              {engine.muted ? "Muted — tap to talk" : "Mute"}
            </Button>
            <div className="mt-4">
              <MicLevel
                value={micGain}
                onChange={adjustMicGain}
                disabled={engine.status === "starting" || engine.status === "ended"}
              />
              <p className="text-[0.8125rem] text-muted">
                Changes take effect straight away, and are remembered for next time.
              </p>
            </div>

            {/* Devices ---------------------------------------------------- */}
            {engine.devices.mics.length > 0 && (
              <DevicePicker
                id="noisy-room-mic"
                label="Microphone"
                devices={engine.devices.mics}
                value={engine.currentMic}
                onChange={engine.setMicDevice}
                onOpen={engine.refreshDevices}
                disabled={engine.status === "ended"}
              />
            )}
            {engine.devices.speakers.length > 0 && (
              <DevicePicker
                id="noisy-room-speaker"
                label="Speaker"
                devices={engine.devices.speakers}
                value={engine.currentSpeaker}
                onChange={engine.setSpeakerDevice}
                onOpen={engine.refreshDevices}
                disabled={engine.status === "ended"}
              />
            )}
            {engine.devices.mics.length > 0 && (
              <p className="mt-1 text-[0.8125rem] text-muted">
                Earbuds that connect after you joined show up when you open the menu.
                {engine.devices.speakers.length === 0 &&
                  " Your phone picks the speaker itself; plug in or pair and it follows."}
              </p>
            )}

            {/* Who's here ------------------------------------------------- */}
            <h3 className="mt-4 mb-1 text-sm text-muted">Who&rsquo;s here</h3>
            {engine.peers.length === 0 ? (
              <p className="text-sm text-muted/80">
                {engine.status === "connected"
                  ? "Just you so far. Hold up the code."
                  : "Nobody yet."}
              </p>
            ) : (
              <ul className="divide-y divide-muted/15 text-[0.9375rem]">
                {engine.peers.map((peer) => (
                  <li
                    key={peer.streamID}
                    data-stream={peer.streamID}
                    className="flex items-center gap-3 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {peer.label || "Someone"}
                      {peer.muted && <span className="ml-1 text-muted" title="Muted">🔇</span>}
                    </span>
                    <span className="shrink-0 text-[0.8125rem] text-muted">
                      {peer.groups.length ? peer.groups.map(labelFor).join(", ") : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Engine ----------------------------------------------------- */}
            <div className="mt-4 border-t border-muted/15 pt-3">
              <button
                type="button"
                onClick={() => setShowEngine((v) => !v)}
                aria-expanded={showEngine}
                className="text-[0.8125rem] text-muted underline underline-offset-2 hover:text-accent"
              >
                {showEngine ? "Hide" : "Show"} the audio engine
              </button>
              <span className="ml-2 text-[0.8125rem] text-muted/80">
                for volume per person, the settings gear, or if something needs a tap.
              </span>
              {/* Collapsed, not removed: the frame must stay alive and in the
                  document for the call to keep running. */}
              <div
                className={showEngine ? "mt-2" : "h-0 overflow-hidden"}
                aria-hidden={!showEngine}
              >
                <iframe
                  ref={engineFrame}
                  src={session.src}
                  title={`Audio engine for ${room}`}
                  allow={ENGINE_ALLOW}
                  className="h-[28rem] w-full rounded-lg border-0 bg-black"
                />
              </div>
              <p className="mt-2 text-[0.8125rem] text-muted">
                Audio not starting?{" "}
                <a
                  href={session.fallback}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setSession(null)}
                  className="underline underline-offset-2 hover:text-accent"
                >
                  Open the call in its own tab
                </a>{" "}
                instead.
              </p>
            </div>
          </>
        ) : (
          <>
            <h2 className="label-caps mb-3">Join</h2>
            <label className="mb-1 block text-sm text-muted" htmlFor="noisy-room-name">
              Your name (shown to the others)
            </label>
            <div className="mb-3 flex gap-2">
              <TextInput
                id="noisy-room-name"
                value={name}
                maxLength={MAX_LABEL_LENGTH}
                placeholder="Optional"
                autoComplete="nickname"
                onChange={(event) => rememberName(event.target.value)}
              />
            </div>
            <MicLevel value={micGain} onChange={rememberMicGain} />
            <p className="mb-4 text-[0.8125rem] text-muted">
              Everyone starts at {DEFAULT_MIC_GAIN}%: phones this close to mouths run hot. You can
              change it during the call too.
            </p>
            <Button id="noisy-room-join" onClick={join}>
              Put on headphones &amp; join
            </Button>
            <p className="mt-3 text-center text-sm text-muted">
              Allow the microphone when asked. You start at the{" "}
              <strong className="text-ink">{TABLE_GROUP}</strong>.
            </p>
          </>
        )}
      </section>

      {/* Side rooms --------------------------------------------------- */}
      <section className="panel mb-3 p-4">
        <h2 className="label-caps mb-1">Side rooms</h2>
        <p className="mb-3 text-sm text-muted">
          Private huddles inside the room. Every room has{" "}
          {DEFAULT_GROUPS.map((group, index) => (
            <span key={group}>
              {index > 0 && (index === DEFAULT_GROUPS.length - 1 ? " and " : ", ")}
              <strong className="text-ink">{group}</strong>
            </span>
          ))}{" "}
          built in; anything added here becomes another button for anyone who joins from this page.
        </p>

        {sideRooms.length === 0 ? (
          <p className="mb-3 text-sm text-muted/80">No extra side rooms yet.</p>
        ) : (
          <ul className="mb-3 divide-y divide-muted/15">
            {sideRooms.map((side) => {
              const mayRemove = viewerId !== null && (isHost || side.createdBy === viewerId);
              return (
                <li key={side.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block font-display font-bold">{side.label}</span>
                    {side.label !== side.id && (
                      <span className="block text-[0.8125rem] text-muted">
                        button reads “{side.id}”
                      </span>
                    )}
                  </span>
                  {mayRemove && (
                    <IconButton
                      aria-label={`Remove ${side.label}`}
                      disabled={pending}
                      onClick={() => removeSideRoom(side.id, side.label)}
                      className="h-10"
                    >
                      ×
                    </IconButton>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {storageOk ? (
          sideRooms.length < MAX_SIDE_ROOMS && (
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                addSideRoom();
              }}
            >
              <label className="sr-only" htmlFor="noisy-room-side">
                New side room name
              </label>
              <TextInput
                id="noisy-room-side"
                value={draft}
                maxLength={MAX_LABEL_LENGTH}
                placeholder="e.g. Partners A, Kitchen"
                onChange={(event) => setDraft(event.target.value)}
                disabled={pending}
              />
              <Button
                type="submit"
                variant="ghost"
                width="auto"
                disabled={pending || !draft.trim()}
              >
                {pending ? "Saving…" : "+ Add"}
              </Button>
            </form>
          )
        ) : (
          <p className="text-sm text-muted">
            Side rooms can&rsquo;t be saved right now; the built-in ones still work.
          </p>
        )}
        {preview && draft.trim() && preview !== draft.trim() && (
          <p className="mt-2 text-[0.8125rem] text-muted">
            The button will read <strong className="text-ink">{preview}</strong>.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-accent">{error}</p>}

        <p className="mt-3 text-[0.8125rem] text-muted/80">
          New side rooms become buttons for everyone in the call within a few seconds.
        </p>
      </section>

      {/* Full-screen code ---------------------------------------------- */}
      {bigCode && pageUrl && (
        <button
          type="button"
          onClick={() => setBigCode(false)}
          aria-label="Close the full-screen code"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-white p-6"
        >
          <QrCode value={pageUrl} className="w-full max-w-[min(80vw,70vh)]" />
          <span className="font-display text-2xl font-bold tracking-wide text-black">{room}</span>
          <span className="text-sm text-black/60">Tap anywhere to close</span>
        </button>
      )}
    </div>
  );
}

/** The microphone gain slider, used before joining and during the call. */
function MicLevel({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <label className="text-sm text-muted" htmlFor="noisy-room-gain">
          Mic level
        </label>
        <span className="font-display text-sm tabular-nums text-accent">{value}%</span>
      </div>
      <div className="mb-1 flex items-center gap-2">
        <input
          id="noisy-room-gain"
          type="range"
          min={MIN_MIC_GAIN}
          max={MAX_MIC_GAIN}
          step={MIC_GAIN_STEP}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 accent-accent disabled:opacity-40"
        />
        <Button
          variant="ghost"
          width="auto"
          className="py-1.5 text-xs"
          onClick={() => onChange(DEFAULT_MIC_GAIN)}
          disabled={disabled || value === DEFAULT_MIC_GAIN}
        >
          Reset
        </Button>
      </div>
    </>
  );
}

/**
 * A device menu. The engine reports which device is live; if that id isn't in
 * the list yet (menus lag a moment behind a switch) the menu shows it as
 * "current" rather than jumping to the wrong entry.
 */
function DevicePicker({
  id,
  label,
  devices,
  value,
  onChange,
  onOpen,
  disabled = false,
}: {
  id: string;
  label: string;
  devices: { deviceId: string; label: string }[];
  value: string | null;
  onChange: (deviceId: string) => void;
  onOpen: () => void;
  disabled?: boolean;
}) {
  // Before anyone has chosen, the browser is on its default device; show
  // that rather than an empty "Choose…" when the list names one.
  const effective = value ?? devices.find((d) => d.deviceId === "default")?.deviceId ?? null;
  const known = effective !== null && devices.some((d) => d.deviceId === effective);
  return (
    <div className="mt-3">
      <label className="mb-1 block text-sm text-muted" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={known ? effective : ""}
        disabled={disabled}
        onChange={(event) => event.target.value && onChange(event.target.value)}
        onFocus={onOpen}
        onPointerDown={onOpen}
        className="w-full rounded-lg border border-muted/35 bg-well/60 px-3 py-2.5 text-base text-ink outline-none focus:border-accent disabled:opacity-40"
      >
        {!known && <option value="">{effective ? "Current device" : "Choose…"}</option>}
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    </div>
  );
}
