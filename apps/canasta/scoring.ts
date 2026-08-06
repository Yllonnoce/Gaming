/**
 * Classic Canasta scoring.
 *
 * Kept apart from the UI because this is where the game's actual rules live --
 * the parts a player would argue about at the table. Card values are not
 * modelled: the scorekeeper enters the melded total and the hand penalty, and
 * this module handles the bonuses, the red-three rule, and the meld minimum.
 */

export const NATURAL_CANASTA = 500;
export const MIXED_CANASTA = 300;
export const RED_THREE = 100;
/** A partnership holding all four red threes scores double for each. */
export const ALL_FOUR_RED_THREES = 800;
export const GOING_OUT = 100;
export const GOING_OUT_CONCEALED = 200;

export const DEFAULT_TARGET = 5000;
export const DEFAULT_ROUNDS = 4;

export type TeamEntry = {
  naturalCanastas: number;
  mixedCanastas: number;
  redThrees: number;
  /** Point value of all melded cards. Free text so the field can be empty. */
  meldedPoints: string;
  /** Point value of cards still held, deducted from the round. */
  cardsInHand: string;
};

export type RoundData = {
  entries: TeamEntry[];
  /** Index of the team that went out, or null if the stock ran out first. */
  outTeam: number | null;
  concealed: boolean;
};

export type ScoreLine = {
  label: string;
  detail?: string;
  points: number;
};

export function blankEntry(): TeamEntry {
  return {
    naturalCanastas: 0,
    mixedCanastas: 0,
    redThrees: 0,
    meldedPoints: "",
    cardsInHand: "",
  };
}

export function blankRound(teamCount: number): RoundData {
  return {
    entries: Array.from({ length: teamCount }, blankEntry),
    outTeam: null,
    concealed: false,
  };
}

/** Empty and malformed fields both read as zero; negatives are not meaningful here. */
export function toPoints(value: string): number {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

/**
 * The meld a partnership must lay down to open, which rises as they climb.
 * Shown during play as a reference -- it changes often enough mid-game that
 * tables regularly get it wrong.
 */
export function minimumMeld(total: number): number {
  if (total < 0) return 15;
  if (total < 1500) return 50;
  if (total < 3000) return 90;
  return 120;
}

/**
 * Break one team's hand into its component lines. Returning the lines rather
 * than just a total lets the UI show its working, so a disputed score can be
 * checked without re-entering anything.
 */
export function scoreTeam(
  entry: TeamEntry,
  wentOut: boolean,
  concealed = false,
): { lines: ScoreLine[]; total: number } {
  const lines: ScoreLine[] = [];
  const melded = toPoints(entry.meldedPoints);
  const inHand = toPoints(entry.cardsInHand);

  if (entry.naturalCanastas > 0) {
    lines.push({
      label: "Natural canastas",
      detail: `${entry.naturalCanastas} × ${NATURAL_CANASTA}`,
      points: entry.naturalCanastas * NATURAL_CANASTA,
    });
  }

  if (entry.mixedCanastas > 0) {
    lines.push({
      label: "Mixed canastas",
      detail: `${entry.mixedCanastas} × ${MIXED_CANASTA}`,
      points: entry.mixedCanastas * MIXED_CANASTA,
    });
  }

  if (entry.redThrees > 0) {
    const allFour = entry.redThrees === 4;
    const value = allFour ? ALL_FOUR_RED_THREES : entry.redThrees * RED_THREE;
    // Red threes are a penalty for a partnership that never got a meld down.
    const melded_ = melded > 0;
    lines.push({
      label: "Red threes",
      detail: allFour
        ? `all four${melded_ ? "" : " — never melded"}`
        : `${entry.redThrees} × ${RED_THREE}${melded_ ? "" : " — never melded"}`,
      points: melded_ ? value : -value,
    });
  }

  if (wentOut) {
    lines.push({
      label: concealed ? "Went out concealed" : "Went out",
      points: concealed ? GOING_OUT_CONCEALED : GOING_OUT,
    });
  }

  if (melded > 0) lines.push({ label: "Melded cards", points: melded });
  if (inHand > 0) lines.push({ label: "Cards in hand", points: -inHand });

  return { lines, total: lines.reduce((sum, line) => sum + line.points, 0) };
}

/** Each team's running total across the first `throughRound` recorded rounds. */
export function totalsThrough(
  rounds: RoundData[],
  throughRound: number,
  teamCount: number,
): number[] {
  return Array.from({ length: teamCount }, (_, teamIndex) =>
    rounds
      .slice(0, throughRound)
      .reduce(
        (sum, round) =>
          sum +
          scoreTeam(round.entries[teamIndex], round.outTeam === teamIndex, round.concealed)
            .total,
        0,
      ),
  );
}
