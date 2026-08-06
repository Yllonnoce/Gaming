import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scoreTeam,
  minimumMeld,
  totalsThrough,
  blankEntry,
  blankRound,
  type TeamEntry,
} from "../apps/canasta/scoring.ts";

/**
 * Canasta's scoring is where the real rules live, so it is tested directly
 * rather than through the UI. Run with `npm test`.
 */

const entry = (over: Partial<TeamEntry> = {}): TeamEntry => ({ ...blankEntry(), ...over });
const total = (e: TeamEntry, out = false, concealed = false) => scoreTeam(e, out, concealed).total;

test("canasta bonuses", () => {
  assert.equal(total(entry({ naturalCanastas: 2 })), 1000);
  assert.equal(total(entry({ mixedCanastas: 1 })), 300);
  assert.equal(
    total(
      entry({ naturalCanastas: 2, mixedCanastas: 1, meldedPoints: "845", cardsInHand: "40" }),
      true,
    ),
    1000 + 300 + 100 + 845 - 40,
  );
});

test("going out", () => {
  assert.equal(total(entry(), true, false), 100);
  assert.equal(total(entry(), true, true), 200);
  // Concealed only applies to the team that actually went out.
  assert.equal(total(entry(), false, true), 0);
});

test("red threes score positive only for a partnership that melded", () => {
  assert.equal(total(entry({ redThrees: 3, meldedPoints: "50" })), 300 + 50);
  assert.equal(total(entry({ redThrees: 3 })), -300);
});

test("all four red threes are worth double", () => {
  assert.equal(total(entry({ redThrees: 4, meldedPoints: "50" })), 800 + 50);
  assert.equal(total(entry({ redThrees: 4 })), -800);
});

test("malformed input reads as zero rather than NaN", () => {
  assert.equal(total(entry({ meldedPoints: "", cardsInHand: "" })), 0);
  assert.equal(total(entry({ meldedPoints: "abc" })), 0);
  assert.equal(total(entry({ meldedPoints: "-500" })), 0);
  assert.equal(total(entry({ meldedPoints: "99.6" })), 100);
});

test("minimum meld climbs with the running score", () => {
  assert.equal(minimumMeld(-5), 15);
  assert.equal(minimumMeld(0), 50);
  assert.equal(minimumMeld(1495), 50);
  assert.equal(minimumMeld(1500), 90);
  assert.equal(minimumMeld(2995), 90);
  assert.equal(minimumMeld(3000), 120);
  assert.equal(minimumMeld(9999), 120);
});

test("running totals accumulate per team", () => {
  const first = blankRound(2);
  first.entries[0] = entry({ naturalCanastas: 1, meldedPoints: "200" }); // 500 + 200
  first.entries[1] = entry({ cardsInHand: "60" }); // -60
  first.outTeam = 0; // +100

  const second = blankRound(2);
  second.entries[0] = entry({ meldedPoints: "100" }); // 100
  second.entries[1] = entry({ mixedCanastas: 2, meldedPoints: "300" }); // 600 + 300
  second.outTeam = 1; // +100

  const rounds = [first, second];
  assert.deepEqual(totalsThrough(rounds, 0, 2), [0, 0]);
  assert.deepEqual(totalsThrough(rounds, 1, 2), [800, -60]);
  assert.deepEqual(totalsThrough(rounds, 2, 2), [900, 940]);
});

test("the going-out bonus follows only the team that went out", () => {
  const round = blankRound(2);
  round.entries[0] = entry({ naturalCanastas: 1, meldedPoints: "200" });
  round.entries[1] = entry({ cardsInHand: "60" });
  round.outTeam = 0;

  assert.equal(scoreTeam(round.entries[0], round.outTeam === 0, false).total, 800);
  assert.equal(scoreTeam(round.entries[1], round.outTeam === 1, false).total, -60);
});

test("scoreTeam shows its working", () => {
  const { lines } = scoreTeam(
    entry({ naturalCanastas: 1, redThrees: 2, meldedPoints: "300", cardsInHand: "25" }),
    true,
  );
  assert.deepEqual(
    lines.map((line) => [line.label, line.points]),
    [
      ["Natural canastas", 500],
      ["Red threes", 200],
      ["Went out", 100],
      ["Melded cards", 300],
      ["Cards in hand", -25],
    ],
  );
});
