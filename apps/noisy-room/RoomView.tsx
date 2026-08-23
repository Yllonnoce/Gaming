"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, IconButton, TextInput } from "@/components/ui";
import { QrCode } from "@/components/QrCode";
import type { SideRoom } from "@/lib/rooms";
import { addSideRoomAction, removeSideRoomAction } from "./actions";
import { commsUrl, roomPath } from "./links";
import { MAX_LABEL_LENGTH, MAX_SIDE_ROOMS, TABLE_GROUP, toGroupId } from "./names";

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
const REFRESH_MS = 15_000;

/**
 * The visitor's name lives in localStorage so it follows them from room to
 * room. Exposed as an external store rather than copied into state in an
 * effect: React reads the server snapshot ("") while hydrating and the real
 * value immediately after, with no extra render pass of our own.
 */
const nameListeners = new Set<() => void>();

function readName(): string {
  try {
    return window.localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeName(value: string) {
  try {
    window.localStorage.setItem(NAME_KEY, value);
  } catch {
    // Private mode; the field still works for this page load via the listeners.
  }
  for (const listener of nameListeners) listener();
}

function subscribeName(listener: () => void) {
  nameListeners.add(listener);
  return () => {
    nameListeners.delete(listener);
  };
}

const subscribeNothing = () => () => {};

export function RoomView({ room, sideRooms, viewerId, hostId, storageOk }: Props) {
  const router = useRouter();
  const name = useSyncExternalStore(subscribeName, readName, () => "");
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
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Side rooms added from another phone show up without a manual reload.
  // Polling is plenty at this scale and needs no connection to keep alive.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router]);

  const joinUrl = useMemo(
    () => commsUrl({ room, sideRooms: sideRooms.map((s) => s.id), label: name }),
    [room, sideRooms, name],
  );

  const rememberName = (value: string) => writeName(value);

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
        <a
          href={joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-lg bg-accent py-3.5 text-center font-display text-sm font-bold uppercase tracking-[0.12em] text-on-accent transition hover:bg-accent-soft"
        >
          Put on headphones &amp; join
        </a>
        <ol className="mt-3 ml-4 list-decimal space-y-1 text-sm text-muted marker:text-accent/60">
          <li>Allow the microphone, then tap <strong className="text-ink">START</strong>.</li>
          <li>
            Tap <strong className="text-ink">{TABLE_GROUP}</strong> to talk and listen with everyone.
          </li>
          <li>Tap a side room instead to talk just with the people in it.</li>
        </ol>
      </section>

      {/* Side rooms --------------------------------------------------- */}
      <section className="panel mb-3 p-4">
        <h2 className="label-caps mb-1">Side rooms</h2>
        <p className="mb-3 text-sm text-muted">
          Private huddles inside the room. Each one becomes a button next to{" "}
          <strong className="text-ink">{TABLE_GROUP}</strong> for anyone who joins from this page.
        </p>

        {sideRooms.length === 0 ? (
          <p className="mb-3 text-sm text-muted/80">None yet.</p>
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
            Side rooms can&rsquo;t be saved right now. You can still make one on the spot: in the
            audio page, tap <strong className="text-ink">+</strong>, type a name, and tell the others
            to do the same.
          </p>
        )}
        {preview && draft.trim() && preview !== draft.trim() && (
          <p className="mt-2 text-[0.8125rem] text-muted">
            The button will read <strong className="text-ink">{preview}</strong>.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-accent">{error}</p>}

        <p className="mt-3 text-[0.8125rem] text-muted/80">
          Already in the audio page when a side room is added? Tap{" "}
          <strong className="text-ink">+</strong> there and type its button name, or come back here
          and join again.
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
