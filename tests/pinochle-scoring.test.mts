import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MELDS,
  meldTotal,
  emptyMelds,
  scoreTeamHand,
  handTotals,
  totals,
  trickTotal,
  isFinished,
  blankTeamHand,
  blankHand,
  TRICK_POINTS_AVAILABLE,
  type MeldKey,
} from "../apps/pinochle/scoring.ts";

const melds = (over: Partial<Record<MeldKey, number>>) => ({ ...emptyMelds(), ...over });

test("meld values match the single-deck table", () => {
  const byKey = Object.fromEntries(MELDS.map((m) => [m.key, m.value]));
  assert.equal(byKey.run, 150);
  assert.equal(byKey.royalMarriage, 40);
  assert.equal(byKey.marriage, 20);
  assert.equal(byKey.pinochle, 40);
  assert.equal(byKey.doublePinochle, 300);
  assert.equal(byKey.acesAround, 100);
  assert.equal(byKey.kingsAround, 80);
  assert.equal(byKey.queensAround, 60);
  assert.equal(byKey.jacksAround, 40);
  assert.equal(byKey.dix, 10);
});

test("meld totals multiply by count", () => {
  assert.equal(meldTotal(melds({ run: 1, marriage: 2, dix: 1 })), 150 + 40 + 10);
  assert.equal(meldTotal(emptyMelds()), 0);
});

test("a non-bidding team simply scores meld plus tricks", () => {
  const { total, set } = scoreTeamHand(
    { melds: melds({ run: 1 }), tricks: "60" },
    false,
    300,
  );
  assert.equal(total, 210);
  assert.equal(set, false);
});

test("a bidding team that makes its contract scores normally", () => {
  const { total, set } = scoreTeamHand(
    { melds: melds({ run: 1, acesAround: 1 }), tricks: "80" },
    true,
    300,
  );
  assert.equal(total, 330);
  assert.equal(set, false);
});

test("a bidding team that falls short is set and loses the bid", () => {
  const { total, set, lines } = scoreTeamHand(
    { melds: melds({ marriage: 1 }), tricks: "40" },
    true,
    300,
  );
  // 20 meld + 40 tricks = 60, well short of 300.
  assert.equal(set, true);
  assert.equal(total, -300);
  assert.equal(lines[0].label, "Set");
});

test("being set costs the bid regardless of meld held", () => {
  const big = scoreTeamHand({ melds: melds({ doublePinochle: 1 }), tricks: "0" }, true, 400);
  assert.equal(big.set, true);
  assert.equal(big.total, -400);
});

test("hand totals apply the bid only to the bidding team", () => {
  const hand = {
    teams: [
      { melds: melds({ marriage: 1 }), tricks: "40" },
      { melds: melds({ run: 1 }), tricks: "210" },
    ],
    biddingTeam: 0,
    bid: "300",
  };
  assert.deepEqual(handTotals(hand, 2), [-300, 360]);
});

test("trick points across both teams come to 250", () => {
  const hand = { ...blankHand(), teams: [{ ...blankTeamHand(), tricks: "150" }, { ...blankTeamHand(), tricks: "100" }] };
  assert.equal(trickTotal(hand), TRICK_POINTS_AVAILABLE);
});

test("the game ends when a team reaches the target", () => {
  const hand = {
    teams: [{ melds: melds({ run: 1 }), tricks: "200" }, blankTeamHand()],
    biddingTeam: null,
    bid: "0",
  };
  assert.deepEqual(totals([hand], 2), [350, 0]);
  assert.equal(isFinished([hand], 2, 1500), false);
  assert.equal(isFinished([hand], 2, 350), true);
});
