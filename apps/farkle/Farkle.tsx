"use client";

import { SimpleScorekeeper, type SimpleConfig } from "@/components/scorekeeper/SimpleScorekeeper";

/**
 * Farkle. Banked points are entered per turn -- a farkled turn is simply zero,
 * which is what an empty field already means.
 */
const CONFIG: SimpleConfig = {
  slug: "farkle",
  title: "Farkle",
  tagline: "Scorekeeper \u00b7 highest total wins",
  direction: "highest",
  minPlayers: 2,
  maxPlayers: 8,
  initialPlayers: 4,
  roundNoun: "Round",
  length: { kind: "target", initial: 10000, label: "Play to" },
  loadingLabel: "Rolling\u2026",
};

export default function Farkle() {
  return <SimpleScorekeeper config={CONFIG} />;
}
