"use client";

import { useAppState, type SyncStatus } from "@/lib/useAppState";

/**
 * Five Crowns scorekeeper.
 *
 * Eleven rounds; the wild card climbs from 3s up to Kings, and the lowest
 * total wins. The whole game -- including half-typed score entry -- lives in
 * one persisted object, so closing the tab mid-round and coming back resumes
 * exactly where the table left off.
 */

const ROUNDS = [
  { num: 1, cards: 3, wild: "3" },
  { num: 2, cards: 4, wild: "4" },
  { num: 3, cards: 5, wild: "5" },
  { num: 4, cards: 6, wild: "6" },
  { num: 5, cards: 7, wild: "7" },
  { num: 6, cards: 8, wild: "8" },
  { num: 7, cards: 9, wild: "9" },
  { num: 8, cards: 10, wild: "10" },
  { num: 9, cards: 11, wild: "J" },
  { num: 10, cards: 12, wild: "Q" },
  { num: 11, cards: 13, wild: "K" },
] as const;

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 7;

type Phase = "setup" | "play" | "done";

type GameState = {
  phase: Phase;
  /** Setup-screen name fields, kept so a half-filled roster survives a reload. */
  names: string[];
  /** Locked-in roster once the game starts. */
  players: string[];
  /** scores[round][player], null until that round is recorded. */
  scores: (number | null)[][];
  round: number;
  /** Raw text of the current round's inputs, before it is committed. */
  entry: string[];
};

const INITIAL: GameState = {
  phase: "setup",
  names: ["", "", "", ""],
  players: [],
  scores: [],
  round: 0,
  entry: [],
};

export default function FiveCrowns() {
  const { state, setState, status, reset } = useAppState<GameState>(
    "five-crowns",
    "current",
    INITIAL,
  );

  // Until the stored game loads, showing the setup screen would flash a "new
  // game" at someone who has one in progress.
  if (status === "loading") {
    return (
      <div className="panel p-6 text-center text-lilac" role="status">
        Shuffling…
      </div>
    );
  }

  const { phase, names, players, scores, round, entry } = state;

  const totals = players.map((_, playerIndex) =>
    scores.reduce((sum, roundScores) => sum + (roundScores[playerIndex] ?? 0), 0),
  );

  const roundIsComplete = (roundIndex: number) =>
    Boolean(scores[roundIndex]) && scores[roundIndex].every((value) => value !== null);

  const standings = players
    .map((name, playerIndex) => ({ name, total: totals[playerIndex] }))
    .sort((a, b) => a.total - b.total);

  const bestTotal = standings.length ? standings[0].total : 0;
  const winners = standings.filter((s) => s.total === bestTotal);

  // ---- setup ------------------------------------------------------------
  const trimmedNames = names.map((n) => n.trim()).filter(Boolean);
  const canStart = trimmedNames.length >= MIN_PLAYERS;

  const startGame = () => {
    const roster = trimmedNames;
    setState({
      phase: "play",
      names,
      players: roster,
      scores: ROUNDS.map(() => roster.map(() => null)),
      round: 0,
      entry: roster.map(() => ""),
    });
  };

  // ---- scoring ----------------------------------------------------------
  const entryIsValid =
    entry.length > 0 &&
    entry.every((value) => {
      const trimmed = value.trim();
      return trimmed !== "" && Number.isFinite(Number(trimmed));
    });

  const saveRound = () => {
    setState((previous) => {
      const committed = previous.entry.map((value) =>
        Math.max(0, Math.round(Number(value))),
      );
      const nextScores = previous.scores.map((roundScores, index) =>
        index === previous.round ? committed : roundScores,
      );

      // Advance to the first round still missing scores, which lets a player go
      // back and fix an earlier round without losing their place in the game.
      const nextRound = nextScores.findIndex(
        (roundScores) => !roundScores.every((value) => value !== null),
      );

      if (nextRound === -1) {
        return { ...previous, scores: nextScores, phase: "done" };
      }
      return {
        ...previous,
        scores: nextScores,
        round: nextRound,
        entry: nextScores[nextRound].map((value) => (value !== null ? String(value) : "")),
      };
    });
  };

  const jumpToRound = (roundIndex: number) => {
    setState((previous) => ({
      ...previous,
      phase: previous.phase === "done" ? "play" : previous.phase,
      round: roundIndex,
      entry: previous.scores[roundIndex].map((value) =>
        value !== null ? String(value) : "",
      ),
    }));
  };

  const playAgain = () => {
    setState((previous) => ({
      ...previous,
      phase: "play",
      scores: ROUNDS.map(() => previous.players.map(() => null)),
      round: 0,
      entry: previous.players.map(() => ""),
    }));
  };

  const currentRound = ROUNDS[round];

  return (
    <div>
      <header className="mb-5 text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-[0.18em]">
          Five Crowns
        </h1>
        <p className="mt-1 text-sm text-lilac">Scorekeeper · lowest total wins</p>
      </header>

      {phase === "setup" && (
        <div className="panel p-4">
          <h2 className="label-caps mb-3">
            Players ({MIN_PLAYERS}–{MAX_PLAYERS})
          </h2>

          {names.map((name, index) => (
            <div key={index} className="mb-2 flex gap-2">
              <label className="sr-only" htmlFor={`player-${index}`}>
                Player {index + 1} name
              </label>
              <input
                id={`player-${index}`}
                className="min-w-0 flex-1 rounded-lg border border-lilac/35 bg-plum-deep/60 px-3 py-2.5 text-base text-cream outline-none focus:border-gold"
                value={name}
                placeholder={`Player ${index + 1}`}
                onChange={(event) =>
                  setState((previous) => {
                    const next = [...previous.names];
                    next[index] = event.target.value;
                    return { ...previous, names: next };
                  })
                }
              />
              <button
                type="button"
                className="w-11 rounded-lg border border-lilac/35 text-lg text-lilac transition enabled:hover:border-gold enabled:hover:text-gold disabled:opacity-30"
                disabled={names.length <= MIN_PLAYERS}
                onClick={() =>
                  setState((previous) => ({
                    ...previous,
                    names: previous.names.filter((_, i) => i !== index),
                  }))
                }
                aria-label={`Remove player ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}

          {names.length < MAX_PLAYERS && (
            <button
              type="button"
              className="mt-1.5 w-full rounded-lg border border-gold/50 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-gold transition hover:bg-gold/10"
              onClick={() =>
                setState((previous) => ({ ...previous, names: [...previous.names, ""] }))
              }
            >
              + Add player
            </button>
          )}

          <button
            type="button"
            className="mt-1.5 w-full rounded-lg bg-gold py-3.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-plum transition hover:bg-gold-soft disabled:opacity-40 disabled:hover:bg-gold"
            disabled={!canStart}
            onClick={startGame}
          >
            Deal round 1
          </button>

          {!canStart && (
            <p className="mt-2.5 text-center text-sm text-lilac">
              Enter at least two names to start.
            </p>
          )}
        </div>
      )}

      {phase === "play" && (
        <>
          <div className="panel mb-4 p-4">
            <div className="mb-3.5 flex items-center gap-4">
              <WildCard wild={currentRound.wild} />
              <div>
                <div className="font-display text-xl font-bold tracking-wide">
                  Round {currentRound.num} of {ROUNDS.length}
                </div>
                <div className="mt-0.5 text-sm text-lilac">
                  {currentRound.cards} cards ·{" "}
                  <span className="font-bold text-gold">{currentRound.wild}s are wild</span>
                </div>
              </div>
            </div>

            {players.map((player, playerIndex) => (
              <div
                key={playerIndex}
                className="flex items-center gap-2.5 border-b border-lilac/15 py-2 last:border-b-0"
              >
                <label className="flex-1 text-[17px] font-medium" htmlFor={`score-${playerIndex}`}>
                  {player}
                </label>
                <input
                  id={`score-${playerIndex}`}
                  className="w-20 rounded-lg border border-lilac/35 bg-plum-deep/60 px-1.5 py-2.5 text-center font-display text-lg text-cream outline-none focus:border-gold"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="0"
                  value={entry[playerIndex] ?? ""}
                  onChange={(event) =>
                    setState((previous) => {
                      const next = [...previous.entry];
                      next[playerIndex] = event.target.value;
                      return { ...previous, entry: next };
                    })
                  }
                />
              </div>
            ))}

            <button
              type="button"
              className="mt-3 w-full rounded-lg bg-gold py-3.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-plum transition hover:bg-gold-soft disabled:opacity-40 disabled:hover:bg-gold"
              disabled={!entryIsValid}
              onClick={saveRound}
            >
              {roundIsComplete(round) ? "Update round" : "Save round"}
            </button>
          </div>

          <div className="panel mb-4 p-4">
            <h2 className="label-caps mb-2">Standings</h2>
            <Standings standings={standings} bestTotal={bestTotal} markLeader />
          </div>

          <div className="panel mb-4 p-4">
            <h2 className="label-caps mb-2.5">Rounds — tap to edit</h2>
            <RoundChips current={round} isComplete={roundIsComplete} onJump={jumpToRound} />
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
            <p className="mb-5 mt-0.5 text-[15px] text-lilac">
              {winners.length > 1 ? "tie the crown" : "takes the crown"} with {bestTotal}{" "}
              points
            </p>
            <div className="text-left">
              <Standings standings={standings} bestTotal={bestTotal} />
            </div>
          </div>

          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-gold py-3.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-plum transition hover:bg-gold-soft"
            onClick={playAgain}
          >
            Play again — same players
          </button>
          <button
            type="button"
            className="mt-2 w-full rounded-lg border border-gold/50 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-gold transition hover:bg-gold/10"
            onClick={reset}
          >
            New players
          </button>

          <p className="mt-3 text-center text-sm text-lilac">
            Need to fix a score? Reopen any round below.
          </p>
          <div className="panel mt-3 p-4">
            <RoundChips current={-1} isComplete={roundIsComplete} onJump={jumpToRound} />
          </div>

          <FooterControls status={status} />
        </>
      )}
    </div>
  );
}

/** The rotated playing card showing the round's wild rank. */
function WildCard({ wild }: { wild: string }) {
  return (
    <div
      className="relative h-[82px] w-[58px] flex-shrink-0 -rotate-6 rounded-md bg-cream font-display font-bold text-plum shadow-[3px_4px_0_rgba(0,0,0,0.35)] transition-transform duration-200 hover:rotate-0 motion-reduce:transition-none"
      aria-hidden="true"
    >
      <span className="absolute left-[7px] top-[5px] text-[15px] leading-none">{wild}</span>
      <span className="absolute inset-0 flex items-center justify-center text-3xl text-gold">
        ♛
      </span>
      <span className="absolute bottom-[5px] right-[7px] rotate-180 text-[15px] leading-none">
        {wild}
      </span>
    </div>
  );
}

function Standings({
  standings,
  bestTotal,
  markLeader = false,
}: {
  standings: { name: string; total: number }[];
  bestTotal: number;
  markLeader?: boolean;
}) {
  return (
    <ol>
      {standings.map((entry, index) => {
        const leading = entry.total === bestTotal;
        return (
          <li
            key={entry.name}
            className={`flex items-baseline gap-2.5 py-1.5 text-[17px] ${
              leading ? "text-gold" : ""
            }`}
          >
            <span className="w-[18px] text-[13px] text-lilac">{index + 1}</span>
            <span className="flex-1">
              {markLeader && leading && <span aria-hidden="true">♛ </span>}
              {entry.name}
            </span>
            <span className="font-display text-lg font-bold">{entry.total}</span>
          </li>
        );
      })}
    </ol>
  );
}

function RoundChips({
  current,
  isComplete,
  onJump,
}: {
  current: number;
  isComplete: (index: number) => boolean;
  onJump: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ROUNDS.map((round, index) => {
        const active = index === current;
        const done = isComplete(index);
        return (
          <button
            key={index}
            type="button"
            aria-current={active ? "step" : undefined}
            aria-label={`Round ${round.num}, ${round.wild}s wild${done ? ", scored" : ""}`}
            className={`rounded-full border px-2.5 py-1.5 font-display text-[13px] transition ${
              active
                ? "border-gold bg-gold font-bold text-plum"
                : done
                  ? "border-gold/55 text-gold hover:bg-gold/10"
                  : "border-lilac/35 text-lilac hover:border-gold/55 hover:text-gold"
            }`}
            onClick={() => onJump(index)}
          >
            {round.wild}
          </button>
        );
      })}
    </div>
  );
}

/** Save state, plus the escape hatch to abandon the current game. */
function FooterControls({ status, onReset }: { status: SyncStatus; onReset?: () => void }) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3 text-sm text-lilac/70">
      <SaveIndicator status={status} />
      {onReset && (
        <button
          type="button"
          className="underline underline-offset-2 transition hover:text-gold"
          onClick={() => {
            if (confirm("Abandon this game and start over?")) onReset();
          }}
        >
          Start over
        </button>
      )}
    </div>
  );
}

function SaveIndicator({ status }: { status: SyncStatus }) {
  const text: Record<SyncStatus, string> = {
    loading: "Loading…",
    saving: "Saving…",
    synced: "Saved",
    // Surfaced honestly rather than hidden: the game is safe, but only here.
    local: "Saved on this device only",
  };
  return (
    <span role="status" aria-live="polite">
      {text[status]}
    </span>
  );
}
