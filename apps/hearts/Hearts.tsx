"use client";

import { useAppState } from "@/lib/useAppState";
import { Button, TextInput, IconButton, Standings, FooterControls } from "@/components/ui";
import {
  blankHand,
  handScores,
  enteredTotal,
  totals as computeTotals,
  isFinished,
  toPoints,
  HAND_TOTAL,
  DEFAULT_TARGET,
  type Hand,
} from "./scoring";

/**
 * Hearts scorekeeper.
 *
 * Every hand distributes exactly 26 points, so the app checks the entry against
 * that total rather than trusting it -- a mismatch almost always means a
 * miscount at the table. Shooting the moon is a separate control instead of
 * something you compute by hand.
 */

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 6;

type State = {
  phase: "setup" | "play" | "done";
  draftNames: string[];
  draftTarget: string;
  players: string[];
  target: number;
  hands: Hand[];
  /** Index into hands when revising an earlier one; null when adding a new one. */
  editIndex: number | null;
  entry: Hand;
};

const INITIAL: State = {
  phase: "setup",
  draftNames: ["", "", "", ""],
  draftTarget: String(DEFAULT_TARGET),
  players: [],
  target: DEFAULT_TARGET,
  hands: [],
  editIndex: null,
  entry: blankHand(0),
};

export default function Hearts() {
  const { state, setState, status, reset } = useAppState<State>("hearts", "current", INITIAL);

  if (status === "loading") {
    return (
      <div className="panel p-6 text-center text-muted" role="status">
        Dealing…
      </div>
    );
  }

  const { phase, players, hands, entry, editIndex, target } = state;

  const trimmedNames = state.draftNames.map((n) => n.trim()).filter(Boolean);
  const canStart = trimmedNames.length >= MIN_PLAYERS;

  const startGame = () =>
    setState((previous) => {
      const roster = previous.draftNames.map((n) => n.trim()).filter(Boolean);
      const typed = toPoints(previous.draftTarget);
      return {
        ...previous,
        phase: "play",
        players: roster,
        target: typed > 0 ? typed : DEFAULT_TARGET,
        hands: [],
        editIndex: null,
        entry: blankHand(roster.length),
      };
    });

  const totals = computeTotals(hands, players.length);
  const handIndex = editIndex ?? hands.length;
  const entered = enteredTotal(entry);
  const moonShot = entry.moonShooter !== null;
  const balanced = moonShot || entered === HAND_TOTAL;

  const saveHand = () =>
    setState((previous) => {
      const next =
        previous.editIndex !== null
          ? previous.hands.map((hand, i) => (i === previous.editIndex ? previous.entry : hand))
          : [...previous.hands, previous.entry];
      return {
        ...previous,
        hands: next,
        editIndex: null,
        entry: blankHand(previous.players.length),
        phase: isFinished(next, previous.players.length, previous.target) ? "done" : "play",
      };
    });

  const editHand = (index: number) =>
    setState((previous) => ({
      ...previous,
      phase: "play",
      editIndex: index,
      entry: previous.hands[index],
    }));

  const cancelEdit = () =>
    setState((previous) => ({
      ...previous,
      editIndex: null,
      entry: blankHand(previous.players.length),
      phase: isFinished(previous.hands, previous.players.length, previous.target)
        ? "done"
        : "play",
    }));

  const playAgain = () =>
    setState((previous) => ({
      ...previous,
      phase: "play",
      hands: [],
      editIndex: null,
      entry: blankHand(previous.players.length),
    }));

  const standings = players
    .map((name, index) => ({ name, total: totals[index] }))
    .sort((a, b) => a.total - b.total); // Lowest wins.
  const bestTotal = standings.length ? standings[0].total : 0;
  const winners = standings.filter((s) => s.total === bestTotal);
  const preview = handScores(entry, players.length);

  return (
    <div>
      <header className="mb-5 text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-[0.18em]">Hearts</h1>
        <p className="mt-1 text-sm text-muted">Scorekeeper · lowest total wins</p>
      </header>

      {phase === "setup" && (
        <>
          <div className="panel mb-3 p-4">
            <h2 className="label-caps mb-3">
              Players ({MIN_PLAYERS}–{MAX_PLAYERS})
            </h2>
            {state.draftNames.map((name, index) => (
              <div key={index} className="mb-2 flex gap-2">
                <label className="sr-only" htmlFor={`hearts-p${index}`}>
                  Player {index + 1} name
                </label>
                <TextInput
                  id={`hearts-p${index}`}
                  value={name}
                  placeholder={`Player ${index + 1}`}
                  onChange={(event) =>
                    setState((previous) => ({
                      ...previous,
                      draftNames: previous.draftNames.map((n, i) =>
                        i === index ? event.target.value : n,
                      ),
                    }))
                  }
                />
                <IconButton
                  disabled={state.draftNames.length <= MIN_PLAYERS}
                  aria-label={`Remove player ${index + 1}`}
                  onClick={() =>
                    setState((previous) => ({
                      ...previous,
                      draftNames: previous.draftNames.filter((_, i) => i !== index),
                    }))
                  }
                >
                  ×
                </IconButton>
              </div>
            ))}
            {state.draftNames.length < MAX_PLAYERS && (
              <Button
                variant="ghost"
                className="mt-1.5"
                onClick={() =>
                  setState((previous) => ({
                    ...previous,
                    draftNames: [...previous.draftNames, ""],
                  }))
                }
              >
                + Add player
              </Button>
            )}
          </div>

          <div className="panel mb-3 p-4">
            <h2 className="label-caps mb-3">Game ends at</h2>
            <TextInput
              type="number"
              inputMode="numeric"
              min="1"
              aria-label="Target score"
              className="text-center font-display text-lg"
              value={state.draftTarget}
              onChange={(event) =>
                setState((previous) => ({ ...previous, draftTarget: event.target.value }))
              }
            />
            <p className="mt-2 text-center text-sm text-muted">
              First player to reach this ends the game — lowest total wins.
            </p>
          </div>

          <Button disabled={!canStart} onClick={startGame}>
            Deal the first hand
          </Button>
          {!canStart && (
            <p className="mt-2.5 text-center text-sm text-muted">
              Enter at least three names to start.
            </p>
          )}
        </>
      )}

      {(phase === "play" || (phase === "done" && editIndex !== null)) && (
        <>
          <div className="panel mb-4 p-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <div>
                <div className="font-display text-xl font-bold tracking-wide">
                  {editIndex !== null ? `Editing hand ${editIndex + 1}` : `Hand ${handIndex + 1}`}
                </div>
                <div className="mt-0.5 text-sm text-muted">Playing to {target}</div>
              </div>
              {editIndex !== null && (
                <button
                  type="button"
                  className="text-sm text-muted underline underline-offset-2 transition hover:text-accent"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>

            {players.map((player, index) => (
              <div
                key={index}
                className="flex items-center gap-2 border-b border-muted/15 py-2 last:border-b-0"
              >
                <span className="flex-1 text-[17px]">{player}</span>

                <button
                  type="button"
                  aria-pressed={entry.moonShooter === index}
                  aria-label={`${player} shot the moon`}
                  title="Shot the moon"
                  onClick={() =>
                    setState((previous) => ({
                      ...previous,
                      entry: {
                        ...previous.entry,
                        moonShooter: previous.entry.moonShooter === index ? null : index,
                      },
                    }))
                  }
                  className={`rounded-full border px-2.5 py-1 font-display text-[13px] transition ${
                    entry.moonShooter === index
                      ? "border-accent bg-accent font-bold text-on-accent"
                      : "border-muted/35 text-muted hover:border-accent/55 hover:text-accent"
                  }`}
                >
                  ☾ moon
                </button>

                {moonShot ? (
                  // The rule fixes the outcome, so entry is disabled rather than
                  // left editable and silently ignored.
                  <span className="w-24 shrink-0 text-center font-display text-lg text-accent">
                    {preview[index]}
                  </span>
                ) : (
                  <TextInput
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="0"
                    aria-label={`${player} points taken`}
                    className="max-w-24 flex-none py-2 text-center font-display text-lg"
                    value={entry.points[index] ?? ""}
                    onChange={(event) =>
                      setState((previous) => ({
                        ...previous,
                        entry: {
                          ...previous.entry,
                          points: previous.entry.points.map((v, i) =>
                            i === index ? event.target.value : v,
                          ),
                        },
                      }))
                    }
                  />
                )}
              </div>
            ))}

            {/* A hand is always exactly 26 points, so a mismatch is a miscount. */}
            <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-muted/15 pt-2.5">
              <span className="label-caps">Hand total</span>
              {moonShot ? (
                <span className="font-display text-sm text-accent">
                  moon shot · {HAND_TOTAL} to everyone else
                </span>
              ) : (
                <span
                  className={`font-display text-lg font-bold tabular-nums ${
                    balanced ? "text-accent" : "text-muted"
                  }`}
                >
                  {entered} / {HAND_TOTAL}
                </span>
              )}
            </div>
            {!balanced && (
              <p className="mt-1.5 text-center text-[13px] text-muted">
                A hand should come to {HAND_TOTAL}. You can still save it if your table plays a
                variant.
              </p>
            )}

            <Button className="mt-3" onClick={saveHand}>
              {editIndex !== null ? "Update hand" : "Save hand"}
            </Button>
          </div>

          {hands.length > 0 && (
            <>
              <div className="panel mb-3 p-4">
                <h2 className="label-caps mb-2">Standings</h2>
                <Standings rows={standings} bestTotal={bestTotal} markLeader />
              </div>
              <div className="panel mb-3 p-4">
                <h2 className="label-caps mb-2.5">Hands — tap to edit</h2>
                <HandChips count={hands.length} editing={editIndex} onEdit={editHand} />
              </div>
            </>
          )}

          <FooterControls status={status} onReset={reset} />
        </>
      )}

      {phase === "done" && editIndex === null && (
        <>
          <div className="panel p-4 pt-6 text-center">
            <div className="text-5xl" aria-hidden="true">
              👑
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-wide">
              {winners.map((w) => w.name).join(" & ")}
            </h2>
            <p className="mb-5 mt-0.5 text-[15px] text-muted">
              {winners.length > 1 ? "tie the crown" : "takes the crown"} with {bestTotal} points
            </p>
            <div className="text-left">
              <Standings rows={standings} bestTotal={bestTotal} />
            </div>
          </div>

          <Button className="mt-3" onClick={playAgain}>
            Play again — same players
          </Button>
          <Button variant="ghost" className="mt-2" onClick={reset}>
            New players
          </Button>

          <div className="panel mt-3 p-4">
            <h2 className="label-caps mb-2.5">Hands — tap to edit</h2>
            <HandChips count={hands.length} editing={null} onEdit={editHand} />
          </div>

          <FooterControls status={status} />
        </>
      )}
    </div>
  );
}

function HandChips({
  count,
  editing,
  onEdit,
}: {
  count: number;
  editing: number | null;
  onEdit: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-current={index === editing ? "step" : undefined}
          aria-label={`Edit hand ${index + 1}`}
          onClick={() => onEdit(index)}
          className={`min-w-9 rounded-full border px-2.5 py-1.5 font-display text-[13px] transition ${
            index === editing
              ? "border-accent bg-accent font-bold text-on-accent"
              : "border-accent/55 text-accent hover:bg-accent/10"
          }`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}
