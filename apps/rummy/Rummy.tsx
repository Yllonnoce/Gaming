"use client";

import { SimpleScorekeeper, type SimpleConfig } from "@/components/scorekeeper/SimpleScorekeeper";

/**
 * 500 Rummy. Hands are played until someone reaches the target; a hand can be
 * negative when a player is caught with more deadwood than they melded.
 */
const CONFIG: SimpleConfig = {
  slug: "rummy",
  title: "Rummy",
  tagline: "Scorekeeper \u00b7 highest total wins",
  direction: "highest",
  minPlayers: 2,
  maxPlayers: 6,
  initialPlayers: 4,
  roundNoun: "Hand",
  length: { kind: "target", initial: 500, label: "Play to" },
  loadingLabel: "Dealing\u2026",
};

export default function Rummy() {
  return <SimpleScorekeeper config={CONFIG} />;
}
