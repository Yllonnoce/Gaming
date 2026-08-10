/**
 * Hearts scoring.
 *
 * Thirteen hearts at a point each plus the queen of spades at thirteen means a
 * hand always distributes exactly 26 points -- which the app uses as a check on
 * manual entry. Shooting the moon is the exception: the shooter takes all 26
 * and, under the rule this app implements, gives 26 to everyone else instead.
 */

export const HAND_TOTAL = 26;
export const DEFAULT_TARGET = 100;

export type Hand = {
  /** Points taken, per player, as typed. Ignored when someone shot the moon. */
  points: string[];
  /** Index of the player who took all 26, or null. */
  moonShooter: number | null;
};

export function blankHand(playerCount: number): Hand {
  return { points: Array.from({ length: playerCount }, () => ""), moonShooter: null };
}

export function toPoints(value: string): number {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

/**
 * One hand's points per player. When the moon is shot the entered values are
 * disregarded entirely -- the outcome is fixed by the rule, and keeping the
 * typed numbers around would let a stale entry contradict it.
 */
export function handScores(hand: Hand, playerCount: number): number[] {
  if (hand.moonShooter !== null) {
    return Array.from({ length: playerCount }, (_, index) =>
      index === hand.moonShooter ? 0 : HAND_TOTAL,
    );
  }
  return Array.from({ length: playerCount }, (_, index) => toPoints(hand.points[index] ?? ""));
}

/** Sum of the entered points, for the "x of 26" check shown during entry. */
export function enteredTotal(hand: Hand): number {
  return hand.points.reduce((sum, value) => sum + toPoints(value), 0);
}

export function totals(hands: Hand[], playerCount: number): number[] {
  return hands.reduce<number[]>(
    (running, hand) => {
      const scores = handScores(hand, playerCount);
      return running.map((value, index) => value + scores[index]);
    },
    Array.from({ length: playerCount }, () => 0),
  );
}

/** The game ends as soon as any player reaches the target; lowest total wins. */
export function isFinished(hands: Hand[], playerCount: number, target: number): boolean {
  if (hands.length === 0) return false;
  return Math.max(...totals(hands, playerCount)) >= target;
}
