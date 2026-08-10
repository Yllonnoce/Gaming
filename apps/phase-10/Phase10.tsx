"use client";

import { useAppState } from "@/lib/useAppState";
import { Button, TextInput, IconButton, FooterControls } from "@/components/ui";
import {
  blankRound,
  totals as computeTotals,
  currentPhases,
  phaseDescription,
  hasFinished,
  standings as computeStandings,
  isFinished,
  FINAL_PHASE,
  type Round,
} from "./scoring";

/**
 * Phase 10 scorekeeper.
 *
 * Unlike the other scorekeepers the score does not decide the game: play ends
 * when someone completes phase 10, and the lowest score *among finishers*
 * wins. The standings therefore show the phase alongside the total, because
 * neither number means much on its own.
 */

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;

type State = {
  phase: "setup" | "play" | "done";
  draftNames: string[];
  players: string[];
  rounds: Round[];
  editIndex: number | null;
  entry: Round;
};

const INITIAL: State = {
  phase: "setup",
  draftNames: ["", "", "", ""],
  players: [],
  rounds: [],
  editIndex: null,
  entry: [],
};

export default function Phase10() {
  const { state, setState, status, reset } = useAppState<State>("phase-10", "current", INITIAL);

  if (status === "loading") {
    return (
      <div className="panel p-6 text-center text-muted" role="status">
        Dealing…
      </div>
    );
  }

  const { phase, players, rounds, entry, editIndex } = state;

  const trimmedNames = state.draftNames.map((n) => n.trim()).filter(Boolean);
  const canStart = trimmedNames.length >= MIN_PLAYERS;

  const startGame = () =>
    setState((previous) => {
      const roster = previous.draftNames.map((n) => n.trim()).filter(Boolean);
      return {
        ...previous,
        phase: "play",
        players: roster,
        rounds: [],
        editIndex: null,
        entry: blankRound(roster.length),
      };
    });

  const roundIndex = editIndex ?? rounds.length;
  // Phases as they stood *before* the round being entered, so the card shows
  // what each player is actually attempting right now.
  const phasesBefore = currentPhases(rounds.slice(0, roundIndex), players.length);
  const totals = computeTotals(rounds, players.length);
  const standings = computeStandings(players, rounds);
  const winners = standings.filter((s) => s.finished);

  const saveRound = () =>
    setState((previous) => {
      const next =
        previous.editIndex !== null
          ? previous.rounds.map((round, i) => (i === previous.editIndex ? previous.entry : round))
          : [...previous.rounds, previous.entry];
      return {
        ...previous,
        rounds: next,
        editIndex: null,
        entry: blankRound(previous.players.length),
        phase: isFinished(next, previous.players.length) ? "done" : "play",
      };
    });

  const editRound = (index: number) =>
    setState((previous) => ({
      ...previous,
      phase: "play",
      editIndex: index,
      entry: previous.rounds[index],
    }));

  const cancelEdit = () =>
    setState((previous) => ({
      ...previous,
      editIndex: null,
      entry: blankRound(previous.players.length),
      phase: isFinished(previous.rounds, previous.players.length) ? "done" : "play",
    }));

  const playAgain = () =>
    setState((previous) => ({
      ...previous,
      phase: "play",
      rounds: [],
      editIndex: null,
      entry: blankRound(previous.players.length),
    }));

  return (
    <div>
      <header className="mb-5 text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-[0.18em]">Phase 10</h1>
        <p className="mt-1 text-sm text-muted">First through all ten phases wins</p>
      </header>

      {phase === "setup" && (
        <>
          <div className="panel mb-3 p-4">
            <h2 className="label-caps mb-3">
              Players ({MIN_PLAYERS}–{MAX_PLAYERS})
            </h2>
            {state.draftNames.map((name, index) => (
              <div key={index} className="mb-2 flex gap-2">
                <label className="sr-only" htmlFor={`p10-p${index}`}>
                  Player {index + 1} name
                </label>
                <TextInput
                  id={`p10-p${index}`}
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

          <Button disabled={!canStart} onClick={startGame}>
            Deal round 1
          </Button>
          {!canStart && (
            <p className="mt-2.5 text-center text-sm text-muted">
              Enter at least two names to start.
            </p>
          )}
        </>
      )}

      {(phase === "play" || (phase === "done" && editIndex !== null)) && (
        <>
          <div className="panel mb-4 p-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <div className="font-display text-xl font-bold tracking-wide">
                {editIndex !== null ? `Editing round ${editIndex + 1}` : `Round ${roundIndex + 1}`}
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

            {players.map((player, index) => {
              const playerPhase = phasesBefore[index];
              const done = hasFinished(playerPhase);
              return (
                <div key={index} className="border-b border-muted/15 py-2.5 last:border-b-0">
                  <div className="mb-1.5 flex items-baseline gap-2">
                    <span className="flex-1 text-[17px]">{player}</span>
                    <span className="text-[13px] text-muted">{totals[index]} pts</span>
                  </div>
                  <div className="mb-2 text-[13px] text-accent">
                    {done ? "Completed all ten" : `Phase ${playerPhase} — ${phaseDescription(playerPhase)}`}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={done}
                      aria-pressed={entry[index]?.completed ?? false}
                      onClick={() =>
                        setState((previous) => ({
                          ...previous,
                          entry: previous.entry.map((e, i) =>
                            i === index ? { ...e, completed: !e.completed } : e,
                          ),
                        }))
                      }
                      className={`flex-1 rounded-lg border py-2 font-display text-[13px] transition disabled:opacity-40 ${
                        entry[index]?.completed
                          ? "border-accent bg-accent font-bold text-on-accent"
                          : "border-muted/35 text-muted enabled:hover:border-accent/55 enabled:hover:text-accent"
                      }`}
                    >
                      {entry[index]?.completed ? "✓ Made the phase" : "Made the phase?"}
                    </button>
                    <TextInput
                      type="number"
                      inputMode="numeric"
                      min="0"
                      placeholder="0"
                      aria-label={`${player} points left in hand`}
                      className="max-w-24 flex-none py-2 text-center font-display text-lg"
                      value={entry[index]?.score ?? ""}
                      onChange={(event) =>
                        setState((previous) => ({
                          ...previous,
                          entry: previous.entry.map((e, i) =>
                            i === index ? { ...e, score: event.target.value } : e,
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
              );
            })}

            <Button className="mt-3" onClick={saveRound}>
              {editIndex !== null ? "Update round" : "Save round"}
            </Button>
          </div>

          {rounds.length > 0 && (
            <>
              <div className="panel mb-3 p-4">
                <h2 className="label-caps mb-2">Standings</h2>
                <PhaseStandings rows={standings} />
              </div>
              <div className="panel mb-3 p-4">
                <h2 className="label-caps mb-2.5">Rounds — tap to edit</h2>
                <RoundChips count={rounds.length} editing={editIndex} onEdit={editRound} />
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
              {winners.length > 0
                ? winners
                    .filter((w) => w.total === winners[0].total)
                    .map((w) => w.name)
                    .join(" & ")
                : "—"}
            </h2>
            <p className="mb-5 mt-0.5 text-[15px] text-muted">
              through all {FINAL_PHASE} phases
              {winners.length > 0 && ` with ${winners[0].total} points`}
            </p>
            <div className="text-left">
              <PhaseStandings rows={standings} />
            </div>
          </div>

          <Button className="mt-3" onClick={playAgain}>
            Play again — same players
          </Button>
          <Button variant="ghost" className="mt-2" onClick={reset}>
            New players
          </Button>

          <div className="panel mt-3 p-4">
            <h2 className="label-caps mb-2.5">Rounds — tap to edit</h2>
            <RoundChips count={rounds.length} editing={null} onEdit={editRound} />
          </div>

          <FooterControls status={status} />
        </>
      )}
    </div>
  );
}

/** Shows phase alongside score, since the score alone does not decide the game. */
function PhaseStandings({
  rows,
}: {
  rows: { name: string; total: number; phase: number; finished: boolean }[];
}) {
  return (
    <ol>
      {rows.map((row, index) => (
        <li
          key={row.name}
          className={`flex items-baseline gap-2.5 py-1.5 text-[17px] ${
            row.finished ? "text-accent" : ""
          }`}
        >
          <span className="w-[18px] shrink-0 text-[13px] text-muted">{index + 1}</span>
          <span className="flex-1">
            {row.finished && <span aria-hidden="true">♛ </span>}
            {row.name}
          </span>
          <span className="text-[13px] text-muted">
            {row.finished ? "done" : `phase ${row.phase}`}
          </span>
          <span className="font-display text-lg font-bold tabular-nums">{row.total}</span>
        </li>
      ))}
    </ol>
  );
}

function RoundChips({
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
          aria-label={`Edit round ${index + 1}`}
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
