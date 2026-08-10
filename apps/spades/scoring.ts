/**
 * Spades scoring, partnership rules.
 *
 * The fiddly part is bags: every overtrick is worth a point now and a liability
 * later, because the tenth one costs 100 and resets the count. Tables lose
 * track of this constantly, so the app carries the running bag count across
 * hands rather than asking anyone to remember it.
 */

export const TRICKS_PER_HAND = 13;
export const DEFAULT_TARGET = 500;
export const BAG_LIMIT = 10;
export const BAG_PENALTY = 100;
export const NIL_BONUS = 100;
export const BLIND_NIL_BONUS = 200;

export type NilKind = "none" | "nil" | "blind";

export type TeamHand = {
  /** Combined bid of both partners, excluding any nil bids. */
  bid: string;
  /** Tricks the team took in total, including any taken by a nil bidder. */
  tricks: string;
  /** One entry per partner. */
  nils: NilKind[];
  /** Whether each nil bidder succeeded in taking no tricks. */
  nilMade: boolean[];
};

export type Hand = { teams: TeamHand[] };

export function blankTeamHand(): TeamHand {
  return { bid: "", tricks: "", nils: ["none", "none"], nilMade: [false, false] };
}

export function blankHand(teamCount = 2): Hand {
  return { teams: Array.from({ length: teamCount }, blankTeamHand) };
}

export function toCount(value: string): number {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

export type ScoreLine = { label: string; detail?: string; points: number };

/**
 * One hand for one team, excluding the bag penalty -- that depends on the
 * running total across hands and is applied by `runningTotals`.
 */
export function scoreTeamHand(hand: TeamHand): {
  lines: ScoreLine[];
  points: number;
  bags: number;
} {
  const lines: ScoreLine[] = [];
  const bid = toCount(hand.bid);
  const tricks = toCount(hand.tricks);

  let bags = 0;

  if (bid > 0) {
    if (tricks >= bid) {
      lines.push({ label: "Contract made", detail: `${bid} × 10`, points: bid * 10 });
      bags = tricks - bid;
      if (bags > 0) {
        lines.push({ label: "Bags", detail: `${bags} overtrick${bags === 1 ? "" : "s"}`, points: bags });
      }
    } else {
      lines.push({
        label: "Set",
        detail: `bid ${bid}, took ${tricks}`,
        points: -bid * 10,
      });
    }
  } else if (tricks > 0) {
    // A team whose only bids were nil still collects bags for tricks taken.
    bags = tricks;
    lines.push({ label: "Bags", detail: `${bags} trick${bags === 1 ? "" : "s"}`, points: bags });
  }

  hand.nils.forEach((kind, index) => {
    if (kind === "none") return;
    const made = hand.nilMade[index] ?? false;
    const value = kind === "blind" ? BLIND_NIL_BONUS : NIL_BONUS;
    lines.push({
      label: kind === "blind" ? "Blind nil" : "Nil",
      detail: made ? "made" : "failed",
      points: made ? value : -value,
    });
  });

  return { lines, points: lines.reduce((sum, line) => sum + line.points, 0), bags };
}

export type TeamProgress = { score: number; bags: number; penalties: number };

/**
 * Running score and bag count per team. Bags are carried between hands and
 * every tenth one costs 100 points and clears ten from the count -- so eleven
 * bags leaves one on the books, not eleven.
 */
export function runningTotals(hands: Hand[], teamCount: number): TeamProgress[] {
  const progress: TeamProgress[] = Array.from({ length: teamCount }, () => ({
    score: 0,
    bags: 0,
    penalties: 0,
  }));

  for (const hand of hands) {
    for (let team = 0; team < teamCount; team++) {
      const teamHand = hand.teams[team];
      if (!teamHand) continue;
      const { points, bags } = scoreTeamHand(teamHand);
      const state = progress[team];
      state.score += points;
      state.bags += bags;
      while (state.bags >= BAG_LIMIT) {
        state.bags -= BAG_LIMIT;
        state.score -= BAG_PENALTY;
        state.penalties += 1;
      }
    }
  }

  return progress;
}

/** Tricks across both teams must come to thirteen; used as an entry check. */
export function trickTotal(hand: Hand): number {
  return hand.teams.reduce((sum, team) => sum + toCount(team.tricks), 0);
}

export function isFinished(hands: Hand[], teamCount: number, target: number): boolean {
  if (hands.length === 0) return false;
  return runningTotals(hands, teamCount).some((team) => team.score >= target);
}
