/**
 * Game rules, shown in a collapsible panel on each app page.
 *
 * Rules are plain data rather than markup so every game presents the same way,
 * and they live beside the app they describe. This module is imported only by
 * the app page -- keeping it out of the registry keeps the Edge proxy lean.
 */

export type RulesTable = {
  caption?: string;
  columns: string[];
  rows: string[][];
};

export type RulesBlock =
  | { kind: "text"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "steps"; items: string[] }
  | { kind: "table"; table: RulesTable };

export type RulesSection = {
  heading: string;
  blocks: RulesBlock[];
};

export type RulesTerm = {
  term: string;
  meaning: string;
};

export type Rules = {
  /** One sentence: how you win. */
  objective: string;
  players: string;
  equipment: string;
  /**
   * The game's vocabulary, defined up front. The sections below use these
   * words freely, so a first-time player reads this list before the rules
   * start leaning on it.
   */
  terms?: RulesTerm[];
  sections: RulesSection[];
  /**
   * Where this scorekeeper commits to one reading of a rule that tables vary
   * on. Stated plainly so the rules never quietly contradict the app.
   */
  appNotes?: string[];
};

import { rules as fiveCrowns } from "@/apps/five-crowns/rules";
import { rules as canasta } from "@/apps/canasta/rules";
import { rules as mexicanTrain } from "@/apps/mexican-train/rules";
import { rules as phase10 } from "@/apps/phase-10/rules";
import { rules as hearts } from "@/apps/hearts/rules";
import { rules as spades } from "@/apps/spades/rules";
import { rules as pinochle } from "@/apps/pinochle/rules";
import { rules as rummy } from "@/apps/rummy/rules";
import { rules as golf } from "@/apps/golf/rules";
import { rules as farkle } from "@/apps/farkle/rules";

const RULES: Record<string, Rules> = {
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

export function getRules(slug: string): Rules | undefined {
  return RULES[slug];
}
