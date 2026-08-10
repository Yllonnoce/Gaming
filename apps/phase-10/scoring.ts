/**
 * Phase 10 scoring and phase tracking.
 *
 * The score is only a tiebreaker: the game ends when someone completes phase
 * 10, and the winner is the lowest score *among those who finished it*. A
 * player with a lower score who never got past phase 8 has not won.
 */

export const PHASES = [
  "2 sets of 3",
  "1 set of 3 + 1 run of 4",
  "1 set of 4 + 1 run of 4",
  "1 run of 7",
  "1 run of 8",
  "1 run of 9",
  "2 sets of 4",
  "7 cards of one colour",
  "1 set of 5 + 1 set of 2",
  "1 set of 5 + 1 set of 3",
] as const;

export const FINAL_PHASE = PHASES.length; // 10

/** One player's result for one round. */
export type Entry = {
  /** Points for cards left in hand, as typed. */
  score: string;
  /** Whether they laid down their current phase this round. */
  completed: boolean;
};

export type Round = Entry[];

export function blankEntry(): Entry {
  return { score: "", completed: false };
}

export function blankRound(playerCount: number): Round {
  return Array.from({ length: playerCount }, blankEntry);
}

export function toScore(value: string): number {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

export function totals(rounds: Round[], playerCount: number): number[] {
  return Array.from({ length: playerCount }, (_, playerIndex) =>
    rounds.reduce((sum, round) => sum + toScore(round[playerIndex]?.score ?? ""), 0),
  );
}

/**
 * The phase each player is *currently attempting*, 1-based. A player who has
 * completed phase 10 is reported as 11, which `hasFinished` reads as done.
 */
export function currentPhases(rounds: Round[], playerCount: number): number[] {
  return Array.from({ length: playerCount }, (_, playerIndex) => {
    const completed = rounds.filter((round) => round[playerIndex]?.completed).length;
    return Math.min(completed, FINAL_PHASE) + 1;
  });
}

export function hasFinished(phase: number): boolean {
  return phase > FINAL_PHASE;
}

/** Describes the phase a player is on, or that they are done. */
export function phaseLabel(phase: number): string {
  if (hasFinished(phase)) return "Finished";
  return `Phase ${phase}`;
}

export function phaseDescription(phase: number): string {
  if (hasFinished(phase)) return "completed all ten";
  return PHASES[phase - 1] ?? "";
}

/** The game ends as soon as anyone completes phase 10. */
export function isFinished(rounds: Round[], playerCount: number): boolean {
  return currentPhases(rounds, playerCount).some(hasFinished);
}

export type Standing = { name: string; total: number; phase: number; finished: boolean };

/**
 * Finishers first, ordered by score; everyone else after, also by score. This
 * encodes the win condition directly rather than leaving the caller to sort a
 * plain total and get it wrong.
 */
export function standings(
  players: string[],
  rounds: Round[],
): Standing[] {
  const playerTotals = totals(rounds, players.length);
  const phases = currentPhases(rounds, players.length);

  return players
    .map((name, index) => ({
      name,
      total: playerTotals[index],
      phase: phases[index],
      finished: hasFinished(phases[index]),
    }))
    .sort((a, b) => {
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      if (a.total !== b.total) return a.total - b.total;
      // Further along is better when scores tie.
      return b.phase - a.phase;
    });
}
