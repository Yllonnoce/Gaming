"use client";

import { SimpleScorekeeper, type SimpleConfig } from "@/components/scorekeeper/SimpleScorekeeper";

/**
 * Golf (the card game). Each hole is a deal; the lowest total after the last
 * hole wins. Negative scores are expected -- most variants have minus cards.
 */
const CONFIG: SimpleConfig = {
  slug: "golf",
  title: "Golf",
  tagline: "Scorekeeper \u00b7 lowest total wins",
  direction: "lowest",
  minPlayers: 2,
  maxPlayers: 8,
  initialPlayers: 4,
  roundNoun: "Hole",
  length: { kind: "fixed", choices: [9, 18], initial: 9, noun: "Holes" },
  hint: "Lowest total after the last hole wins.",
  loadingLabel: "Teeing off\u2026",
};

export default function Golf() {
  return <SimpleScorekeeper config={CONFIG} />;
}
