import { test } from "node:test";
import assert from "node:assert/strict";
import {
  currentPhases,
  hasFinished,
  isFinished,
  standings,
  totals,
  blankRound,
  PHASES,
  FINAL_PHASE,
  type Round,
} from "../apps/phase-10/scoring.ts";

const round = (entries: [string, boolean][]): Round =>
  entries.map(([score, completed]) => ({ score, completed }));

test("there are ten phases", () => {
  assert.equal(PHASES.length, 10);
  assert.equal(FINAL_PHASE, 10);
});

test("players start on phase 1 and advance only when they complete one", () => {
  assert.deepEqual(currentPhases([], 2), [1, 1]);
  const rounds = [round([["20", true], ["45", false]])];
  assert.deepEqual(currentPhases(rounds, 2), [2, 1]);
});

test("completing the tenth phase reports as finished", () => {
  const rounds = Array.from({ length: 10 }, () => round([["0", true], ["10", false]]));
  assert.deepEqual(currentPhases(rounds, 2), [11, 1]);
  assert.equal(hasFinished(11), true);
  assert.equal(hasFinished(10), false);
  assert.equal(isFinished(rounds, 2), true);
});

test("a lower score does not win without finishing phase 10", () => {
  // Alice finishes all ten with 200 points; Bob has 5 but is only on phase 2.
  const rounds = [
    ...Array.from({ length: 10 }, () => round([["20", true], ["0", false]])),
    round([["0", false], ["5", true]]),
  ];
  const table = standings(["Alice", "Bob"], rounds);
  assert.equal(table[0].name, "Alice");
  assert.equal(table[0].finished, true);
  assert.equal(table[0].total, 200);
  assert.equal(table[1].name, "Bob");
  assert.equal(table[1].total, 5);
  assert.equal(table[1].finished, false);
});

test("among finishers, the lowest score wins", () => {
  const rounds = Array.from({ length: 10 }, () => round([["20", true], ["5", true]]));
  const table = standings(["Alice", "Bob"], rounds);
  assert.equal(table[0].name, "Bob");
  assert.equal(table[0].total, 50);
  assert.equal(table[1].total, 200);
});

test("totals sum the per-round scores", () => {
  const rounds = [round([["20", true], ["45", false]]), round([["", false], ["5", true]])];
  assert.deepEqual(totals(rounds, 2), [20, 50]);
});

test("a blank round scores nothing and advances nobody", () => {
  const r = blankRound(3);
  assert.deepEqual(totals([r], 3), [0, 0, 0]);
  assert.deepEqual(currentPhases([r], 3), [1, 1, 1]);
});
