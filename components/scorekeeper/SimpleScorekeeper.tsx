"use client";

import { useAppState } from "@/lib/useAppState";
import { Button, TextInput, IconButton, Standings, FooterControls } from "@/components/ui";

/**
 * A scorekeeper for games that need one number per player per round.
 *
 * Golf, Rummy and Farkle differ only in wording, direction and how the game
 * ends, so they are configuration rather than three near-identical components.
 * Games needing extra per-player state -- Hearts' moon, Phase 10's phases --
 * have their own components and reuse the primitives in components/ui instead.
 */

/** Fixed number of rounds, or play on until someone reaches a target. */
export type GameLength =
  | { kind: "fixed"; choices: number[]; initial: number; noun: string }
  | { kind: "target"; initial: number; label: string };

export type SimpleConfig = {
  slug: string;
  title: string;
  tagline: string;
  /** Which end of the standings wins. */
  direction: "lowest" | "highest";
  minPlayers: number;
  maxPlayers: number;
  initialPlayers: number;
  /** "Round", "Hand", "Hole" -- used throughout the UI. */
  roundNoun: string;
  length: GameLength;
  hint?: string;
  loadingLabel?: string;
};

type State = {
  phase: "setup" | "play" | "done";
  draftNames: string[];
  /** Hole count or target score, as typed. */
  draftLength: string;
  players: string[];
  lengthValue: number;
  /** rounds[i] is null when that round has not been recorded yet. */
  rounds: (string[] | null)[];
  round: number;
  entry: string[];
};

/**
 * Scores may legitimately be negative -- Golf has minus cards, Rummy can go
 * below zero -- so unlike Five Crowns this does not clamp at zero.
 */
export function toScore(value: string): number {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function totalsOf(rounds: (string[] | null)[], playerCount: number): number[] {
  return Array.from({ length: playerCount }, (_, playerIndex) =>
    rounds.reduce((sum, round) => sum + (round ? toScore(round[playerIndex]) : 0), 0),
  );
}

export function SimpleScorekeeper({ config }: { config: SimpleConfig }) {
  const initial: State = {
    phase: "setup",
    draftNames: Array.from({ length: config.initialPlayers }, () => ""),
    draftLength: String(
      config.length.kind === "fixed" ? config.length.initial : config.length.initial,
    ),
    players: [],
    lengthValue: config.length.initial,
    rounds: [],
    round: 0,
    entry: [],
  };

  const { state, setState, status, reset } = useAppState<State>(
    config.slug,
    "current",
    initial,
  );

  if (status === "loading") {
    return (
      <div className="panel p-6 text-center text-muted" role="status">
        {config.loadingLabel ?? "Shuffling…"}
      </div>
    );
  }

  const { phase, players, rounds, round, entry, lengthValue } = state;

  const trimmedNames = state.draftNames.map((n) => n.trim()).filter(Boolean);
  const canStart = trimmedNames.length >= config.minPlayers;

  const startGame = () =>
    setState((previous) => {
      const roster = previous.draftNames.map((n) => n.trim()).filter(Boolean);
      const typed = toScore(previous.draftLength);
      const value = typed > 0 ? typed : config.length.initial;
      return {
        ...previous,
        phase: "play",
        players: roster,
        lengthValue: value,
        rounds: config.length.kind === "fixed" ? Array.from({ length: value }, () => null) : [],
        round: 0,
        entry: roster.map(() => ""),
      };
    });

  const totals = totalsOf(rounds, players.length);
  const recorded = (index: number) => rounds[index] != null;
  /** In target games the round list grows, so the current round may be new. */
  const roundCount = config.length.kind === "fixed" ? lengthValue : rounds.length + 1;

  const saveRound = () =>
    setState((previous) => {
      const next = [...previous.rounds];
      if (previous.round < next.length) next[previous.round] = previous.entry;
      else next.push(previous.entry);

      // Recomputed from the full list rather than toggled, so revising an early
      // round can un-finish a game that had already ended, and vice versa.
      let finished: boolean;
      let nextRound: number;
      if (config.length.kind === "fixed") {
        const firstEmpty = next.findIndex((r) => r == null);
        finished = firstEmpty === -1;
        nextRound = finished ? previous.round : firstEmpty;
      } else {
        // Whoever reaches the target ends the game; direction decides who won.
        finished = Math.max(...totalsOf(next, previous.players.length)) >= previous.lengthValue;
        nextRound = next.length;
      }

      return {
        ...previous,
        rounds: next,
        round: nextRound,
        entry: previous.players.map(() => ""),
        phase: finished ? "done" : "play",
      };
    });

  const jumpTo = (index: number) =>
    setState((previous) => ({
      ...previous,
      phase: previous.phase === "done" ? "play" : previous.phase,
      round: index,
      entry: previous.rounds[index] ?? previous.players.map(() => ""),
    }));

  const playAgain = () =>
    setState((previous) => ({
      ...previous,
      phase: "play",
      rounds:
        config.length.kind === "fixed"
          ? Array.from({ length: previous.lengthValue }, () => null)
          : [],
      round: 0,
      entry: previous.players.map(() => ""),
    }));

  const standings = players
    .map((name, index) => ({ name, total: totals[index] }))
    .sort((a, b) => (config.direction === "lowest" ? a.total - b.total : b.total - a.total));
  const bestTotal = standings.length ? standings[0].total : 0;
  const winners = standings.filter((s) => s.total === bestTotal);

  return (
    <div>
      <header className="mb-5 text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-[0.18em]">
          {config.title}
        </h1>
        <p className="mt-1 text-sm text-muted">{config.tagline}</p>
      </header>

      {phase === "setup" && (
        <>
          <div className="panel mb-3 p-4">
            <h2 className="label-caps mb-3">
              Players ({config.minPlayers}–{config.maxPlayers})
            </h2>
            {state.draftNames.map((name, index) => (
              <div key={index} className="mb-2 flex gap-2">
                <label className="sr-only" htmlFor={`${config.slug}-p${index}`}>
                  Player {index + 1} name
                </label>
                <TextInput
                  id={`${config.slug}-p${index}`}
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
                  disabled={state.draftNames.length <= config.minPlayers}
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
            {state.draftNames.length < config.maxPlayers && (
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
            <h2 className="label-caps mb-3">
              {config.length.kind === "fixed" ? config.length.noun : config.length.label}
            </h2>
            {config.length.kind === "fixed" ? (
              <div className="flex gap-2">
                {config.length.choices.map((choice) => {
                  const selected = toScore(state.draftLength) === choice;
                  return (
                    <button
                      key={choice}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setState((previous) => ({ ...previous, draftLength: String(choice) }))
                      }
                      className={`flex-1 rounded-lg border py-2.5 font-display text-[0.9375rem] transition ${
                        selected
                          ? "border-accent bg-accent font-bold text-on-accent"
                          : "border-muted/35 text-muted hover:border-accent/55 hover:text-accent"
                      }`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            ) : (
              <TextInput
                type="number"
                inputMode="numeric"
                min="1"
                className="text-center font-display text-lg"
                aria-label={config.length.label}
                value={state.draftLength}
                onChange={(event) =>
                  setState((previous) => ({ ...previous, draftLength: event.target.value }))
                }
              />
            )}
          </div>

          <Button disabled={!canStart} onClick={startGame}>
            Start
          </Button>
          {!canStart && (
            <p className="mt-2.5 text-center text-sm text-muted">
              Enter at least {config.minPlayers} names to start.
            </p>
          )}
        </>
      )}

      {phase === "play" && (
        <>
          <div className="panel mb-4 p-4">
            <div className="mb-3">
              <div className="font-display text-xl font-bold tracking-wide">
                {config.roundNoun} {round + 1}
                {config.length.kind === "fixed" && ` of ${lengthValue}`}
              </div>
              <div className="mt-0.5 text-sm text-muted">
                {config.length.kind === "target"
                  ? `${config.length.label} ${lengthValue}`
                  : config.hint}
              </div>
            </div>

            {players.map((player, index) => (
              <div
                key={index}
                className="flex items-center gap-2 border-b border-muted/15 py-2 last:border-b-0"
              >
                <span className="flex-1 text-[1.0625rem]">{player}</span>
                <TextInput
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  aria-label={`${player} score`}
                  className="max-w-24 flex-none py-2 text-center font-display text-lg"
                  value={entry[index] ?? ""}
                  onChange={(event) =>
                    setState((previous) => ({
                      ...previous,
                      entry: previous.entry.map((v, i) =>
                        i === index ? event.target.value : v,
                      ),
                    }))
                  }
                />
              </div>
            ))}

            <Button className="mt-3" onClick={saveRound}>
              {recorded(round) ? `Update ${config.roundNoun.toLowerCase()}` : `Save ${config.roundNoun.toLowerCase()}`}
            </Button>
          </div>

          {rounds.some(Boolean) && (
            <div className="panel mb-3 p-4">
              <h2 className="label-caps mb-2">Standings</h2>
              <Standings rows={standings} bestTotal={bestTotal} markLeader />
            </div>
          )}

          <div className="panel mb-3 p-4">
            <h2 className="label-caps mb-2.5">
              {config.roundNoun}s — tap to edit
            </h2>
            <RoundChips
              count={roundCount}
              current={round}
              isRecorded={recorded}
              onJump={jumpTo}
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
            <p className="mb-5 mt-0.5 text-[0.9375rem] text-muted">
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

          <p className="mt-3 text-center text-sm text-muted">
            Need to fix a score? Reopen any {config.roundNoun.toLowerCase()} below.
          </p>
          <div className="panel mt-3 p-4">
            <RoundChips
              count={rounds.length}
              current={-1}
              isRecorded={recorded}
              onJump={jumpTo}
            />
          </div>

          <FooterControls status={status} />
        </>
      )}
    </div>
  );
}

function RoundChips({
  count,
  current,
  isRecorded,
  onJump,
}: {
  count: number;
  current: number;
  isRecorded: (index: number) => boolean;
  onJump: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: count }, (_, index) => {
        const active = index === current;
        return (
          <button
            key={index}
            type="button"
            aria-current={active ? "step" : undefined}
            aria-label={`Edit round ${index + 1}`}
            onClick={() => onJump(index)}
            className={`min-w-9 rounded-full border px-2.5 py-1.5 font-display text-[0.8125rem] transition ${
              active
                ? "border-accent bg-accent font-bold text-on-accent"
                : isRecorded(index)
                  ? "border-accent/55 text-accent hover:bg-accent/10"
                  : "border-muted/35 text-muted hover:border-accent/55 hover:text-accent"
            }`}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}
