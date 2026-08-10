/**
 * Pinochle scoring: partnership, single deck.
 *
 * 48 cards, four players in two teams, bidding for trump. Meld is where tables
 * argue, so it is entered as a breakdown rather than a number. Trick points
 * come to 240 plus 10 for the last trick, 250 in all.
 */

export const TRICK_POINTS_AVAILABLE = 250;
export const DEFAULT_TARGET = 1500;
export const MIN_BID = 250;

/** Meld items and their values, in the order they appear in the UI. */
export const MELDS = [
  { key: "run", label: "Run in trump", detail: "A-10-K-Q-J", value: 150 },
  { key: "royalMarriage", label: "Royal marriage", detail: "K-Q of trump", value: 40 },
  { key: "marriage", label: "Marriage", detail: "K-Q, other suits", value: 20 },
  { key: "pinochle", label: "Pinochle", detail: "J♦ + Q♠", value: 40 },
  { key: "doublePinochle", label: "Double pinochle", detail: "both", value: 300 },
  { key: "acesAround", label: "Aces around", detail: "one of each suit", value: 100 },
  { key: "kingsAround", label: "Kings around", value: 80 },
  { key: "queensAround", label: "Queens around", value: 60 },
  { key: "jacksAround", label: "Jacks around", value: 40 },
  { key: "dix", label: "Dix", detail: "9 of trump", value: 10 },
] as const;

export type MeldKey = (typeof MELDS)[number]["key"];

export type TeamHand = {
  /** Count of each meld item held. */
  melds: Record<MeldKey, number>;
  /** Trick points taken, as typed. */
  tricks: string;
};

export type Hand = {
  teams: TeamHand[];
  /** Which team took the bid, or null if not recorded. */
  biddingTeam: number | null;
  bid: string;
};

export function emptyMelds(): Record<MeldKey, number> {
  return Object.fromEntries(MELDS.map((meld) => [meld.key, 0])) as Record<MeldKey, number>;
}

export function blankTeamHand(): TeamHand {
  return { melds: emptyMelds(), tricks: "" };
}

export function blankHand(teamCount = 2): Hand {
  return {
    teams: Array.from({ length: teamCount }, blankTeamHand),
    biddingTeam: null,
    bid: "",
  };
}

export function toPoints(value: string): number {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

export function meldTotal(melds: Record<MeldKey, number>): number {
  return MELDS.reduce((sum, meld) => sum + (melds[meld.key] ?? 0) * meld.value, 0);
}

export type ScoreLine = { label: string; detail?: string; points: number };

/**
 * One team's hand. A bidding team that fails to make its contract is "set":
 * it loses the bid outright and its meld does not count.
 */
export function scoreTeamHand(
  hand: TeamHand,
  isBidder: boolean,
  bid: number,
): { lines: ScoreLine[]; total: number; set: boolean } {
  const meld = meldTotal(hand.melds);
  const tricks = toPoints(hand.tricks);
  const set = isBidder && meld + tricks < bid;

  if (set) {
    return {
      lines: [{ label: "Set", detail: `needed ${bid}, made ${meld + tricks}`, points: -bid }],
      total: -bid,
      set: true,
    };
  }

  const lines: ScoreLine[] = [];
  if (meld > 0) lines.push({ label: "Meld", points: meld });
  if (tricks > 0) lines.push({ label: "Tricks", points: tricks });

  return { lines, total: meld + tricks, set: false };
}

export function handTotals(hand: Hand, teamCount: number): number[] {
  const bid = toPoints(hand.bid);
  return Array.from(
    { length: teamCount },
    (_, team) =>
      scoreTeamHand(hand.teams[team] ?? blankTeamHand(), hand.biddingTeam === team, bid).total,
  );
}

export function totals(hands: Hand[], teamCount: number): number[] {
  return hands.reduce<number[]>(
    (running, hand) => {
      const scores = handTotals(hand, teamCount);
      return running.map((value, index) => value + scores[index]);
    },
    Array.from({ length: teamCount }, () => 0),
  );
}

/** Trick points across both teams should come to 250; used as an entry check. */
export function trickTotal(hand: Hand): number {
  return hand.teams.reduce((sum, team) => sum + toPoints(team.tricks), 0);
}

export function isFinished(hands: Hand[], teamCount: number, target: number): boolean {
  if (hands.length === 0) return false;
  return Math.max(...totals(hands, teamCount)) >= target;
}
