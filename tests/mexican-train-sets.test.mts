import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SETS,
  getSet,
  engines,
  engineLabel,
  tileCount,
  cellScore,
  totals,
  toPips,
  blankRound,
  type Cell,
} from "../apps/mexican-train/sets.ts";

/**
 * The set definition drives the length of the game, so the round derivation is
 * tested directly. Run with `npm test`.
 */

const cell = (pips: string, blank = false): Cell => ({ pips, blank });

test("a double-N set holds the triangular number of tiles", () => {
  assert.equal(tileCount(6), 28);
  assert.equal(tileCount(9), 55);
  assert.equal(tileCount(12), 91);
  assert.equal(tileCount(15), 136);
  assert.equal(tileCount(18), 190);
});

test("declared tile counts match the formula", () => {
  for (const set of SETS) {
    assert.equal(set.tiles, tileCount(set.highestDouble), `${set.name} tile count`);
  }
});

test("engines count down from the highest double to blank", () => {
  assert.deepEqual(engines(3), [3, 2, 1, 0]);
  assert.equal(engines(12).length, 13);
  assert.equal(engines(15).length, 16);
  assert.equal(engines(12)[0], 12);
  assert.equal(engines(12).at(-1), 0);
});

test("hand count is one more than the highest double", () => {
  for (const set of SETS) {
    assert.equal(engines(set.highestDouble).length, set.highestDouble + 1, set.name);
  }
});

test("engine labels read correctly, including the blank", () => {
  assert.equal(engineLabel(12), "Double-12");
  assert.equal(engineLabel(1), "Double-1");
  assert.equal(engineLabel(0), "Double-blank");
});

test("getSet falls back rather than returning undefined", () => {
  assert.equal(getSet("double-15").highestDouble, 15);
  // @ts-expect-error -- deliberately invalid, e.g. state from an older version
  assert.equal(getSet("double-99").id, SETS[0].id);
});

test("malformed pip entries read as zero", () => {
  assert.equal(toPips(""), 0);
  assert.equal(toPips("   "), 0);
  assert.equal(toPips("abc"), 0);
  assert.equal(toPips("-20"), 0);
  assert.equal(toPips("23.6"), 24);
});

test("going out scores nothing", () => {
  assert.equal(cellScore(cell(""), null), 0);
  assert.equal(cellScore(cell("0"), 50), 0);
});

test("the double-blank penalty applies only when the rule is on", () => {
  assert.equal(cellScore(cell("23", true), null), 23);
  assert.equal(cellScore(cell("23", true), 50), 73);
  assert.equal(cellScore(cell("23", false), 50), 23);
  // Held with an otherwise empty hand: the penalty replaces the tile's zero.
  assert.equal(cellScore(cell("", true), 50), 50);
});

test("totals accumulate per player and skip unplayed hands", () => {
  const rounds: (Cell[] | null)[] = [
    [cell("0"), cell("23"), cell("8")],
    [cell("15"), cell(""), cell("4", true)],
    null, // not yet played
  ];
  assert.deepEqual(totals(rounds, 3, null), [15, 23, 12]);
  assert.deepEqual(totals(rounds, 3, 50), [15, 23, 62]);
});

test("a blank round is all-empty and scores nothing", () => {
  const round = blankRound(4);
  assert.equal(round.length, 4);
  assert.deepEqual(totals([round], 4, 50), [0, 0, 0, 0]);
});
