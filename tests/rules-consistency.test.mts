import { test } from "node:test";
import assert from "node:assert/strict";
import type { Rules, RulesBlock, RulesTable } from "../lib/rules.ts";

import { rules as fiveCrowns } from "../apps/five-crowns/rules.ts";
import { rules as canasta } from "../apps/canasta/rules.ts";
import { rules as mexicanTrain } from "../apps/mexican-train/rules.ts";
import { rules as phase10 } from "../apps/phase-10/rules.ts";
import { rules as hearts } from "../apps/hearts/rules.ts";
import { rules as spades } from "../apps/spades/rules.ts";
import { rules as pinochle } from "../apps/pinochle/rules.ts";
import { rules as rummy } from "../apps/rummy/rules.ts";
import { rules as golf } from "../apps/golf/rules.ts";
import { rules as farkle } from "../apps/farkle/rules.ts";

import * as canastaScoring from "../apps/canasta/scoring.ts";
import * as spadesScoring from "../apps/spades/scoring.ts";
import * as pinochleScoring from "../apps/pinochle/scoring.ts";
import * as phase10Scoring from "../apps/phase-10/scoring.ts";
import * as heartsScoring from "../apps/hearts/scoring.ts";
import * as mexicanTrainSets from "../apps/mexican-train/sets.ts";

/**
 * The rules shown to players and the arithmetic the apps perform are written
 * in different files, which is exactly how they drift apart. These tests pin
 * the numbers in the rules to the constants in the scoring modules, so a rule
 * change that is not also a code change (or vice versa) fails the build.
 */

const ALL: Record<string, Rules> = {
  "five-crowns": fiveCrowns,
  canasta,
  "mexican-train": mexicanTrain,
  "phase-10": phase10,
  hearts,
  spades,
  pinochle,
  rummy,
  golf,
  farkle,
};

// ---- helpers ----------------------------------------------------------

function tables(rules: Rules): RulesTable[] {
  return rules.sections
    .flatMap((section) => section.blocks)
    .filter((block): block is Extract<RulesBlock, { kind: "table" }> => block.kind === "table")
    .map((block) => block.table);
}

function fullText(rules: Rules): string {
  return JSON.stringify(rules);
}

/**
 * Find a table row whose first cell contains `label` and assert one of its
 * other cells contains `value` once formatting (commas, signs) is stripped.
 */
function assertRow(rules: Rules, label: string, value: number, game: string) {
  const digits = String(Math.abs(value));
  // Substring labels can collide ("Marriage" also matches "Royal marriage"),
  // so gather every matching row and pass if any of them carries the value.
  const matches = tables(rules)
    .flatMap((table) => table.rows)
    .filter((row) => row[0].toLowerCase().includes(label.toLowerCase()));
  assert.ok(matches.length > 0, `${game}: no table row labelled "${label}"`);
  const hit = matches.some((row) =>
    row.slice(1).some((cell) => cell.replace(/[^0-9]/g, "") === digits),
  );
  assert.ok(
    hit,
    `${game}: no row labelled "${label}" carries ${value} — found ${JSON.stringify(matches)}`,
  );
}

// ---- structure: every game, same promises ------------------------------

test("every game's rules are structurally complete", () => {
  for (const [slug, rules] of Object.entries(ALL)) {
    assert.ok(rules.objective.length > 40, `${slug}: objective should explain, not label`);
    assert.ok(rules.players.length > 0, `${slug}: players missing`);
    assert.ok(rules.equipment.length > 20, `${slug}: equipment should describe the deck/set`);
    assert.ok((rules.terms?.length ?? 0) >= 3, `${slug}: needs a vocabulary list`);
    assert.ok(rules.sections.length >= 4, `${slug}: fewer than four sections`);
    assert.ok((rules.appNotes?.length ?? 0) >= 1, `${slug}: missing app assumptions`);

    const headings = rules.sections.map((s) => s.heading);
    assert.equal(new Set(headings).size, headings.length, `${slug}: duplicate section headings`);

    for (const section of rules.sections) {
      assert.ok(section.blocks.length > 0, `${slug}: empty section "${section.heading}"`);
    }
  }
});

test("every table row matches its column count", () => {
  for (const [slug, rules] of Object.entries(ALL)) {
    for (const table of tables(rules)) {
      for (const row of table.rows) {
        assert.equal(
          row.length,
          table.columns.length,
          `${slug}: row [${row}] does not fit columns [${table.columns}]`,
        );
      }
    }
  }
});

test("every game explains its variations honestly", () => {
  for (const [slug, rules] of Object.entries(ALL)) {
    const hasVariations = rules.sections.some((s) =>
      s.heading.toLowerCase().includes("variation"),
    );
    assert.ok(hasVariations, `${slug}: no common-variations section`);
  }
});

// ---- cross-checks: rules numbers == scoring constants ------------------

test("canasta rules match the scoring module", () => {
  assertRow(canasta, "Natural canasta", canastaScoring.NATURAL_CANASTA, "canasta");
  assertRow(canasta, "Mixed canasta", canastaScoring.MIXED_CANASTA, "canasta");
  assertRow(canasta, "Going out concealed", canastaScoring.GOING_OUT_CONCEALED, "canasta");
  assertRow(canasta, "Each red three", canastaScoring.RED_THREE, "canasta");
  assertRow(canasta, "All four red threes", canastaScoring.ALL_FOUR_RED_THREES, "canasta");

  // The minimum-meld table must carry the same thresholds the app displays.
  for (const [total, minimum] of [
    [-1, 15],
    [0, 50],
    [1500, 90],
    [3000, 120],
  ] as const) {
    assert.equal(canastaScoring.minimumMeld(total), minimum);
    const shown = tables(canasta).some((t) =>
      t.rows.some((row) => row.some((cell) => cell.replace(/[^0-9]/g, "") === String(minimum))),
    );
    assert.ok(shown, `canasta: minimum meld ${minimum} missing from rules`);
  }
});

test("spades rules match the scoring module", () => {
  assertRow(spades, "Nil", spadesScoring.NIL_BONUS, "spades");
  assertRow(spades, "Blind nil", spadesScoring.BLIND_NIL_BONUS, "spades");

  const text = fullText(spades);
  assert.ok(text.includes("ten bags"), "spades: bag limit not spelled out");
  assert.ok(
    text.includes(`${spadesScoring.BAG_PENALTY} points`) ||
      text.includes(`loses ${spadesScoring.BAG_PENALTY}`),
    "spades: bag penalty amount not stated",
  );
  assert.ok(text.includes("thirteen tricks"), "spades: trick count not stated");
});

test("pinochle rules carry every meld at its coded value", () => {
  for (const meld of pinochleScoring.MELDS) {
    assertRow(pinochle, meld.label, meld.value, "pinochle");
  }
  assert.ok(
    fullText(pinochle).includes(String(pinochleScoring.TRICK_POINTS_AVAILABLE)),
    "pinochle: 250 available trick points not stated",
  );
});

test("phase 10 rules list all ten phases exactly as the app tracks them", () => {
  const rows = tables(phase10).flatMap((t) => t.rows);
  for (const [index, phase] of phase10Scoring.PHASES.entries()) {
    const found = rows.some((row) => row.includes(phase));
    assert.ok(found, `phase-10: phase ${index + 1} "${phase}" not in the rules table`);
  }
});

test("hearts rules match the 26-point hand", () => {
  assertRow(hearts, "Each heart", 1, "hearts");
  assertRow(hearts, "Queen of spades", 13, "hearts");
  assertRow(hearts, "whole hand", heartsScoring.HAND_TOTAL, "hearts");
  assert.ok(
    fullText(hearts).includes(String(heartsScoring.DEFAULT_TARGET)),
    "hearts: default target not stated",
  );
});

test("mexican train rules match the set definitions", () => {
  for (const set of mexicanTrainSets.SETS) {
    assert.ok(
      mexicanTrain.equipment.includes(String(set.tiles)),
      `mexican-train: ${set.name} tile count ${set.tiles} not in equipment line`,
    );
  }
  // The draw table must cover every player count the sets allow.
  const drawTable = tables(mexicanTrain).find((t) => t.columns[0] === "Players");
  assert.ok(drawTable, "mexican-train: no per-player draw table");
  const maxPlayers = Math.max(...mexicanTrainSets.SETS.map((s) => s.maxPlayers));
  const lastBracket = drawTable.rows.at(-1)![0];
  assert.ok(
    lastBracket.includes(String(maxPlayers)),
    `mexican-train: draw table stops before ${maxPlayers} players`,
  );
});

test("five crowns rules score the cards the app expects", () => {
  assertRow(fiveCrowns, "Joker", 50, "five-crowns");
  assertRow(fiveCrowns, "King", 13, "five-crowns");
  assertRow(fiveCrowns, "wild", 20, "five-crowns");
});

test("golf and farkle carry their signature values", () => {
  assertRow(golf, "King", 0, "golf");
  assertRow(golf, "Two", -2, "golf");
  assertRow(farkle, "Three 1s", 1000, "farkle");
  assertRow(farkle, "Straight", 1500, "farkle");
  assertRow(farkle, "Two triplets", 2500, "farkle");
});

test("rummy states the ace's split personality", () => {
  assertRow(rummy, "Ace melded high", 15, "rummy");
  assertRow(rummy, "Ace in an A-2-3", 1, "rummy");
});
