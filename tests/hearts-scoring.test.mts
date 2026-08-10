import { test } from "node:test";
import assert from "node:assert/strict";
import {
  handScores,
  enteredTotal,
  totals,
  isFinished,
  blankHand,
  HAND_TOTAL,
  type Hand,
} from "../apps/hearts/scoring.ts";

const hand = (points: string[], moonShooter: number | null = null): Hand => ({ points, moonShooter });

test("a normal hand scores what was entered", () => {
  assert.deepEqual(handScores(hand(["0", "13", "8", "5"]), 4), [0, 13, 8, 5]);
});

test("a hand always comes to 26", () => {
  assert.equal(enteredTotal(hand(["0", "13", "8", "5"])), HAND_TOTAL);
});

test("shooting the moon gives 26 to everyone else", () => {
  assert.deepEqual(handScores(hand(["", "", "", ""], 1), 4), [26, 0, 26, 26]);
});

test("a stale entry cannot contradict a moon shot", () => {
  // Numbers typed before the moon toggle was hit are disregarded entirely.
  assert.deepEqual(handScores(hand(["10", "16", "0", "0"], 2), 4), [26, 26, 0, 26]);
});

test("totals accumulate across hands", () => {
  const hands = [hand(["0", "13", "8", "5"]), hand(["", "", "", ""], 0)];
  assert.deepEqual(totals(hands, 4), [0, 39, 34, 31]);
});

test("the game ends when someone reaches the target", () => {
  const hands = [hand(["0", "26", "0", "0"])];
  assert.equal(isFinished(hands, 4, 100), false);
  assert.equal(isFinished(hands, 4, 26), true);
  assert.equal(isFinished([], 4, 26), false);
});

test("a blank hand is empty and scores nothing", () => {
  assert.deepEqual(handScores(blankHand(4), 4), [0, 0, 0, 0]);
});
