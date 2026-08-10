/**
 * Mexican Train: set definitions and scoring.
 *
 * A game runs one hand per double, counting down from the set's highest double
 * to double-blank -- so the set size *is* the round count, and everything else
 * follows from `highestDouble`. Adding double-18 later means one more entry in
 * SETS and nothing else.
 */

export type SetId = "double-12" | "double-15";

export type DominoSet = {
  id: SetId;
  name: string;
  /** The engine for the first hand; also determines how many hands are played. */
  highestDouble: number;
  tiles: number;
  /** Commonly cited maximum for the set; enforced at setup. */
  maxPlayers: number;
};

export const SETS: DominoSet[] = [
  { id: "double-12", name: "Double-12", highestDouble: 12, tiles: 91, maxPlayers: 8 },
  { id: "double-15", name: "Double-15", highestDouble: 15, tiles: 136, maxPlayers: 10 },
];

export const DEFAULT_SET: SetId = "double-12";
export const MIN_PLAYERS = 2;

/** Default for the optional house rule; only applied when the rule is on. */
export const DEFAULT_BLANK_PENALTY = 50;

export function getSet(id: SetId): DominoSet {
  return SETS.find((set) => set.id === id) ?? SETS[0];
}

/** A double-N set is a triangular number of tiles: (N+1)(N+2)/2. */
export function tileCount(highestDouble: number): number {
  return ((highestDouble + 1) * (highestDouble + 2)) / 2;
}

/** Engines in play order: highest double first, double-blank last. */
export function engines(highestDouble: number): number[] {
  return Array.from({ length: highestDouble + 1 }, (_, i) => highestDouble - i);
}

export function engineLabel(engine: number): string {
  return engine === 0 ? "Double-blank" : `Double-${engine}`;
}

/** One player's result for one hand: the pips they were caught with. */
export type Cell = {
  pips: string;
  /** Whether they held the 0-0 tile, which only matters under the house rule. */
  blank: boolean;
};

export function blankCell(): Cell {
  return { pips: "", blank: false };
}

export function blankRound(playerCount: number): Cell[] {
  return Array.from({ length: playerCount }, blankCell);
}

/**
 * Empty and malformed entries both read as zero, which is also the score for
 * going out -- an empty hand is worth nothing.
 */
export function toPips(value: string): number {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

/**
 * The double-blank is worth no pips, so under the house rule its penalty
 * replaces that zero rather than adding to a pip value.
 */
export function cellScore(cell: Cell, blankPenalty: number | null): number {
  return toPips(cell.pips) + (cell.blank && blankPenalty !== null ? blankPenalty : 0);
}

/** Each player's running total across every recorded hand. Lowest wins. */
export function totals(
  rounds: (Cell[] | null)[],
  playerCount: number,
  blankPenalty: number | null,
): number[] {
  return Array.from({ length: playerCount }, (_, playerIndex) =>
    rounds.reduce(
      (sum, round) => sum + (round ? cellScore(round[playerIndex], blankPenalty) : 0),
      0,
    ),
  );
}
