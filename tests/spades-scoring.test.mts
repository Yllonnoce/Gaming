import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scoreTeamHand,
  runningTotals,
  blankTeamHand,
  blankHand,
  trickTotal,
  isFinished,
  type TeamHand,
  type Hand,
} from "../apps/spades/scoring.ts";

const team = (over: Partial<TeamHand> = {}): TeamHand => ({ ...blankTeamHand(), ...over });
const hand = (a: TeamHand, b: TeamHand): Hand => ({ teams: [a, b] });

test("making the contract scores ten per trick bid", () => {
  const { points, bags } = scoreTeamHand(team({ bid: "7", tricks: "7" }));
  assert.equal(points, 70);
  assert.equal(bags, 0);
});

test("overtricks are worth a point each and count as bags", () => {
  const { points, bags } = scoreTeamHand(team({ bid: "7", tricks: "9" }));
  assert.equal(points, 72);
  assert.equal(bags, 2);
});

test("falling short loses ten per trick bid", () => {
  const { points, bags } = scoreTeamHand(team({ bid: "5", tricks: "4" }));
  assert.equal(points, -50);
  assert.equal(bags, 0);
});

test("a nil-only team still takes bags for tricks won", () => {
  const { points, bags } = scoreTeamHand(
    team({ bid: "0", tricks: "3", nils: ["nil", "none"], nilMade: [false, false] }),
  );
  // 3 bags, minus 100 for the failed nil.
  assert.equal(bags, 3);
  assert.equal(points, 3 - 100);
});

test("nil and blind nil pay both ways", () => {
  assert.equal(
    scoreTeamHand(team({ bid: "4", tricks: "4", nils: ["nil", "none"], nilMade: [true, false] }))
      .points,
    40 + 100,
  );
  assert.equal(
    scoreTeamHand(team({ bid: "4", tricks: "4", nils: ["blind", "none"], nilMade: [true, false] }))
      .points,
    40 + 200,
  );
  assert.equal(
    scoreTeamHand(team({ bid: "4", tricks: "4", nils: ["blind", "none"], nilMade: [false, false] }))
      .points,
    40 - 200,
  );
});

test("the tenth bag costs 100 and clears ten from the count", () => {
  // Nine hands of one overtrick each: nine bags, no penalty yet.
  const nine = Array.from({ length: 9 }, () =>
    hand(team({ bid: "3", tricks: "4" }), team({ bid: "9", tricks: "9" })),
  );
  let progress = runningTotals(nine, 2);
  assert.equal(progress[0].bags, 9);
  assert.equal(progress[0].penalties, 0);
  assert.equal(progress[0].score, 9 * 31);

  // The tenth tips it over.
  const ten = [...nine, hand(team({ bid: "3", tricks: "4" }), team({ bid: "9", tricks: "9" }))];
  progress = runningTotals(ten, 2);
  assert.equal(progress[0].bags, 0, "bag count resets");
  assert.equal(progress[0].penalties, 1);
  assert.equal(progress[0].score, 10 * 31 - 100);
});

test("eleven bags leaves one on the books, not eleven", () => {
  const hands = [hand(team({ bid: "1", tricks: "12" }), team({ bid: "1", tricks: "1" }))];
  const progress = runningTotals(hands, 2);
  assert.equal(progress[0].bags, 1);
  assert.equal(progress[0].penalties, 1);
  // 10 for the bid + 11 bags - 100 penalty.
  assert.equal(progress[0].score, 10 + 11 - 100);
});

test("tricks across both teams total thirteen", () => {
  assert.equal(trickTotal(hand(team({ tricks: "7" }), team({ tricks: "6" }))), 13);
  assert.equal(trickTotal(blankHand()), 0);
});

test("the game ends when a team reaches the target", () => {
  const hands = [hand(team({ bid: "10", tricks: "10" }), team({ bid: "3", tricks: "3" }))];
  assert.equal(isFinished(hands, 2, 500), false);
  assert.equal(isFinished(hands, 2, 100), true);
  assert.equal(isFinished([], 2, 100), false);
});
