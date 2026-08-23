"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useAppState } from "@/lib/useAppState";
import { generateRoomName } from "./names";
import { roomPath } from "./links";

/**
 * The hub entry for Noisy Room. All it does is mint a room and send you to its
 * page; the page is what gets shared. The current room is remembered per
 * visitor so coming back to the hub finds the same code rather than a new one.
 */

type Current = { room: string | null; startedAt: number | null };

const INITIAL: Current = { room: null, startedAt: null };

export default function NoisyRoom() {
  const router = useRouter();
  const { state, setState, status } = useAppState<Current>("noisy-room", "current", INITIAL);

  const start = () => {
    const room = generateRoomName();
    setState({ room, startedAt: Date.now() });
    router.push(roomPath(room));
  };

  const startAgain = () => {
    if (
      state.room &&
      !window.confirm(
        `Start a new room? People holding the old code (${state.room}) will need the new one.`,
      )
    ) {
      return;
    }
    start();
  };

  return (
    <div>
      <header className="mb-5 text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-[0.18em]">Noisy Room</h1>
        <p className="mt-1 text-sm text-muted">Tool · the table, in everyone&rsquo;s headphones</p>
      </header>

      <div className="panel mb-3 p-4 text-[0.9375rem] leading-relaxed">
        <p>
          Start a room, show the code, and everyone who scans it hears the table through their own
          earbuds — handy in a loud bar, a big hall, or for anyone who finds cross-table chatter hard
          to follow.
        </p>
        <p className="mt-2 text-muted">
          Side rooms let two or three people talk privately without leaving the table. Anyone can
          make one.
        </p>
      </div>

      {status === "loading" ? (
        <div className="panel p-4 text-center text-sm text-muted">Checking for your room…</div>
      ) : state.room ? (
        <div className="panel p-4">
          <h2 className="label-caps mb-2">Your room</h2>
          <p className="mb-4 break-all font-display text-xl font-bold tracking-wide">{state.room}</p>
          <Link
            href={roomPath(state.room)}
            className="block w-full rounded-lg bg-accent py-3.5 text-center font-display text-sm font-bold uppercase tracking-[0.12em] text-on-accent transition hover:bg-accent-soft"
          >
            Open room &amp; code
          </Link>
          <Button variant="ghost" className="mt-2" onClick={startAgain}>
            Start a different room
          </Button>
        </div>
      ) : (
        <div className="panel p-4">
          <Button onClick={start}>Start a room</Button>
          <p className="mt-3 text-center text-sm text-muted">
            You&rsquo;ll get a code and a link to share. Nothing to install.
          </p>
        </div>
      )}
    </div>
  );
}
