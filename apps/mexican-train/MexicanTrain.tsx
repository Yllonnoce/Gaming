"use client";

import { useAppState } from "@/lib/useAppState";
import { Button, TextInput, IconButton, Standings, FooterControls } from "@/components/ui";
import {
  SETS,
  getSet,
  engines,
  engineLabel,
  blankRound,
  totals,
  toPips,
  DEFAULT_SET,
  DEFAULT_BLANK_PENALTY,
  MIN_PLAYERS,
  type Cell,
  type SetId,
} from "./sets";

/**
 * Mexican Train scorekeeper.
 *
 * One hand per double, counting down from the set's highest to double-blank,
 * so the chosen set determines the length of the game. Each player is scored on
 * the pips left in their hand and the lowest total wins; going out is simply a
 * hand worth nothing.
 */

type Phase = "setup" | "play" | "done";

type GameState = {
  phase: Phase;
  /** Setup-screen fields, kept so a half-filled roster survives a reload. */
  draftNames: string[];
  draftSet: SetId;
  draftBlankRule: boolean;
  draftBlankValue: string;
  /** Locked in when the game starts. */
  players: string[];
  set: SetId;
  /** null when the double-blank house rule is off. */
  blankPenalty: number | null;
  /** rounds[hand] is null until that hand is recorded. */
  rounds: (Cell[] | null)[];
  round: number;
  /** The hand being entered, before it is committed. */
  entry: Cell[];
};

const INITIAL: GameState = {
  phase: "setup",
  draftNames: ["", "", "", ""],
  draftSet: DEFAULT_SET,
  draftBlankRule: false,
  draftBlankValue: String(DEFAULT_BLANK_PENALTY),
  players: [],
  set: DEFAULT_SET,
  blankPenalty: null,
  rounds: [],
  round: 0,
  entry: [],
};

export default function MexicanTrain() {
  const { state, setState, status, reset } = useAppState<GameState>(
    "mexican-train",
    "current",
    INITIAL,
  );

  if (status === "loading") {
    return (
      <div className="panel p-6 text-center text-muted" role="status">
        Shuffling…
      </div>
    );
  }

  const { phase, players, rounds, round, entry, blankPenalty } = state;

  // ---- setup ------------------------------------------------------------
  const draftSet = getSet(state.draftSet);
  const trimmedNames = state.draftNames.map((n) => n.trim()).filter(Boolean);
  const tooManyPlayers = trimmedNames.length > draftSet.maxPlayers;
  const canStart = trimmedNames.length >= MIN_PLAYERS && !tooManyPlayers;

  const startGame = () => {
    setState((previous) => {
      const roster = previous.draftNames.map((n) => n.trim()).filter(Boolean);
      const chosen = getSet(previous.draftSet);
      const penalty = previous.draftBlankRule
        ? toPips(previous.draftBlankValue) || DEFAULT_BLANK_PENALTY
        : null;

      return {
        ...previous,
        phase: "play",
        players: roster,
        set: previous.draftSet,
        blankPenalty: penalty,
        rounds: engines(chosen.highestDouble).map(() => null),
        round: 0,
        entry: blankRound(roster.length),
      };
    });
  };

  // ---- play -------------------------------------------------------------
  const activeSet = getSet(state.set);
  const hands = engines(activeSet.highestDouble);
  const playerTotals = totals(rounds, players.length, blankPenalty);
  const handRecorded = (index: number) => rounds[index] !== null;

  const updateCell = (playerIndex: number, patch: Partial<Cell>) =>
    setState((previous) => ({
      ...previous,
      entry: previous.entry.map((cell, index) =>
        index === playerIndex ? { ...cell, ...patch } : cell,
      ),
    }));

  const saveHand = () => {
    setState((previous) => {
      const nextRounds = previous.rounds.map((existing, index) =>
        index === previous.round ? previous.entry : existing,
      );

      // Move to the first hand still missing scores, so going back to fix an
      // earlier one does not lose your place in the game.
      const nextIndex = nextRounds.findIndex((hand) => hand === null);
      if (nextIndex === -1) {
        return { ...previous, rounds: nextRounds, phase: "done" };
      }
      return {
        ...previous,
        rounds: nextRounds,
        round: nextIndex,
        entry: nextRounds[nextIndex] ?? blankRound(previous.players.length),
      };
    });
  };

  const jumpToHand = (index: number) =>
    setState((previous) => ({
      ...previous,
      phase: previous.phase === "done" ? "play" : previous.phase,
      round: index,
      entry: previous.rounds[index] ?? blankRound(previous.players.length),
    }));

  const playAgain = () =>
    setState((previous) => ({
      ...previous,
      phase: "play",
      rounds: engines(getSet(previous.set).highestDouble).map(() => null),
      round: 0,
      entry: blankRound(previous.players.length),
    }));

  const standings = players
    .map((name, playerIndex) => ({ name, total: playerTotals[playerIndex] }))
    .sort((a, b) => a.total - b.total); // Lowest pips win.
  const bestTotal = standings.length ? standings[0].total : 0;
  const winners = standings.filter((s) => s.total === bestTotal);

  const engine = hands[round] ?? 0;

  return (
    <div>
      <header className="mb-5 text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-[0.18em]">
          Mexican Train
        </h1>
        <p className="mt-1 text-sm text-muted">Scorekeeper · lowest total wins</p>
      </header>

      {phase === "setup" && (
        <>
          <div className="panel mb-3 p-4">
            <h2 className="label-caps mb-3">Domino set</h2>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {SETS.map((option) => {
                const selected = option.id === state.draftSet;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setState((previous) => ({ ...previous, draftSet: option.id }))}
                    className={`rounded-lg border px-3 py-2.5 text-left transition ${
                      selected
                        ? "border-accent bg-accent/10"
                        : "border-muted/35 hover:border-accent/55"
                    }`}
                  >
                    <span
                      className={`block font-display text-base font-bold ${
                        selected ? "text-accent" : ""
                      }`}
                    >
                      {option.name}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                      {option.tiles} tiles · {option.highestDouble + 1} hands
                      <br />
                      up to {option.maxPlayers} players
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-sm text-muted">
              One hand per double, from {engineLabel(draftSet.highestDouble).toLowerCase()} down
              to double-blank.
            </p>
          </div>

          <div className="panel mb-3 p-4">
            <h2 className="label-caps mb-3">
              Players ({MIN_PLAYERS}–{draftSet.maxPlayers})
            </h2>

            {state.draftNames.map((name, index) => (
              <div key={index} className="mb-2 flex gap-2">
                <label className="sr-only" htmlFor={`mt-player-${index}`}>
                  Player {index + 1} name
                </label>
                <TextInput
                  id={`mt-player-${index}`}
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

            {state.draftNames.length < draftSet.maxPlayers && (
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
            <h2 className="label-caps mb-3">House rule</h2>
            <label className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={state.draftBlankRule}
                onClick={() =>
                  setState((previous) => ({
                    ...previous,
                    draftBlankRule: !previous.draftBlankRule,
                  }))
                }
                className={`h-6 w-11 shrink-0 rounded-full border transition ${
                  state.draftBlankRule
                    ? "border-accent bg-accent"
                    : "border-muted/40 bg-well/60"
                }`}
              >
                <span
                  className={`block h-4 w-4 rounded-full transition ${
                    state.draftBlankRule
                      ? "ml-[22px] bg-on-accent"
                      : "ml-1 bg-muted"
                  }`}
                />
              </button>
              <span className="flex-1 text-[15px]">
                Double-blank penalty
                <span className="mt-0.5 block text-[13px] text-muted">
                  The 0-0 tile scores a fixed penalty instead of nothing.
                </span>
              </span>
            </label>

            {state.draftBlankRule && (
              <label className="mt-3 flex items-center gap-3 border-t border-muted/15 pt-3 text-[15px]">
                <span className="flex-1 text-muted">Penalty value</span>
                <TextInput
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="max-w-24 flex-none py-2 text-center font-display"
                  value={state.draftBlankValue}
                  onChange={(event) =>
                    setState((previous) => ({
                      ...previous,
                      draftBlankValue: event.target.value,
                    }))
                  }
                />
              </label>
            )}
          </div>

          <Button disabled={!canStart} onClick={startGame}>
            Start the {engineLabel(draftSet.highestDouble).toLowerCase()} hand
          </Button>

          {tooManyPlayers ? (
            <p className="mt-2.5 text-center text-sm text-muted">
              {draftSet.name} supports up to {draftSet.maxPlayers} players. Remove{" "}
              {trimmedNames.length - draftSet.maxPlayers} or switch sets.
            </p>
          ) : (
            trimmedNames.length < MIN_PLAYERS && (
              <p className="mt-2.5 text-center text-sm text-muted">
                Enter at least two names to start.
              </p>
            )
          )}
        </>
      )}

      {phase === "play" && (
        <>
          <div className="panel mb-4 p-4">
            <div className="mb-3.5 flex items-center gap-4">
              <EngineTile value={engine} />
              <div>
                <div className="font-display text-xl font-bold tracking-wide">
                  {engineLabel(engine)}
                </div>
                <div className="mt-0.5 text-sm text-muted">
                  Hand {round + 1} of {hands.length} · {activeSet.name}
                </div>
              </div>
            </div>

            {players.map((player, playerIndex) => (
              <div
                key={playerIndex}
                className="flex items-center gap-2 border-b border-muted/15 py-2 last:border-b-0"
              >
                <span className="flex-1 text-[17px]">{player}</span>

                {blankPenalty !== null && (
                  <button
                    type="button"
                    aria-pressed={entry[playerIndex]?.blank ?? false}
                    aria-label={`${player} held the double-blank`}
                    title={`Double-blank (+${blankPenalty})`}
                    onClick={() =>
                      updateCell(playerIndex, { blank: !entry[playerIndex]?.blank })
                    }
                    className={`rounded-full border px-2.5 py-1 font-display text-[13px] transition ${
                      entry[playerIndex]?.blank
                        ? "border-accent bg-accent font-bold text-on-accent"
                        : "border-muted/35 text-muted hover:border-accent/55 hover:text-accent"
                    }`}
                  >
                    0-0
                  </button>
                )}

                <TextInput
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="0"
                  aria-label={`${player} pips left`}
                  className="max-w-20 flex-none py-2 text-center font-display text-lg"
                  value={entry[playerIndex]?.pips ?? ""}
                  onChange={(event) => updateCell(playerIndex, { pips: event.target.value })}
                />
              </div>
            ))}

            <p className="mt-2.5 text-center text-[13px] text-muted">
              Leave a player blank if they went out — an empty hand scores nothing.
            </p>

            <Button className="mt-3" onClick={saveHand}>
              {handRecorded(round) ? "Update hand" : "Save hand"}
            </Button>
          </div>

          {rounds.some(Boolean) && (
            <div className="panel mb-3 p-4">
              <h2 className="label-caps mb-2">Standings</h2>
              <Standings rows={standings} bestTotal={bestTotal} markLeader />
            </div>
          )}

          <div className="panel mb-3 p-4">
            <h2 className="label-caps mb-2.5">Hands — tap to edit</h2>
            <HandChips
              hands={hands}
              current={round}
              isRecorded={handRecorded}
              onJump={jumpToHand}
            />
          </div>

          <FooterControls status={status} onReset={reset} />
        </>
      )}

      {phase === "done" && (
        <>
          <div className="panel p-4 pt-6 text-center">
            <div className="text-5xl" aria-hidden="true">
              👑
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-wide">
              {winners.map((w) => w.name).join(" & ")}
            </h2>
            <p className="mb-5 mt-0.5 text-[15px] text-muted">
              {winners.length > 1 ? "tie the crown" : "takes the crown"} with {bestTotal} pips
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

          <p className="mt-3 text-center text-sm text-muted">
            Need to fix a score? Reopen any hand below.
          </p>
          <div className="panel mt-3 p-4">
            <HandChips hands={hands} current={-1} isRecorded={handRecorded} onJump={jumpToHand} />
          </div>

          <FooterControls status={status} />
        </>
      )}
    </div>
  );
}

/** The double that starts the hand, drawn as a domino. */
function EngineTile({ value }: { value: number }) {
  return (
    <div
      className="flex h-[82px] w-[52px] shrink-0 -rotate-6 flex-col overflow-hidden rounded-md bg-card font-display font-bold text-card-ink shadow-[3px_4px_0_rgba(0,0,0,0.35)] transition-transform duration-200 hover:rotate-0 motion-reduce:transition-none"
      aria-hidden="true"
    >
      <span className="flex flex-1 items-center justify-center text-2xl">
        {value === 0 ? "" : value}
      </span>
      <span className="h-px shrink-0 bg-card-ink/30" />
      <span className="flex flex-1 items-center justify-center text-2xl">
        {value === 0 ? "" : value}
      </span>
    </div>
  );
}

function HandChips({
  hands,
  current,
  isRecorded,
  onJump,
}: {
  hands: number[];
  current: number;
  isRecorded: (index: number) => boolean;
  onJump: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {hands.map((engine, index) => {
        const active = index === current;
        return (
          <button
            key={index}
            type="button"
            aria-current={active ? "step" : undefined}
            aria-label={`Edit ${engineLabel(engine).toLowerCase()} hand`}
            onClick={() => onJump(index)}
            className={`min-w-9 rounded-full border px-2.5 py-1.5 font-display text-[13px] transition ${
              active
                ? "border-accent bg-accent font-bold text-on-accent"
                : isRecorded(index)
                  ? "border-accent/55 text-accent hover:bg-accent/10"
                  : "border-muted/35 text-muted hover:border-accent/55 hover:text-accent"
            }`}
          >
            {engine === 0 ? "–" : engine}
          </button>
        );
      })}
    </div>
  );
}
