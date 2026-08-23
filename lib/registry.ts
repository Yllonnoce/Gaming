import type { ComponentType } from "react";

/**
 * The catalogue of everything hosted on the site.
 *
 * Adding an app means creating `apps/<slug>/` with a manifest and a component,
 * then adding one entry below. The hub, routing, and per-app storage all read
 * from here, so nothing else needs to change.
 */

export type AppCategory = "scorekeeper" | "game" | "tool";

export type AppManifest = {
  /** URL segment and storage namespace. Stable forever -- changing it orphans data. */
  slug: string;
  title: string;
  /** One line, shown on the hub card. */
  blurb: string;
  category: AppCategory;
  /** Emoji, used as the card's mark. Cheap, scalable, and needs no asset pipeline. */
  icon: string;
  /** Tailwind classes for the card's accent, letting each app keep its own identity. */
  accent: string;
  /** Hidden from the hub while under construction, but still reachable by URL. */
  draft?: boolean;
};

export const CATEGORY_LABELS: Record<AppCategory, string> = {
  scorekeeper: "Scorekeepers",
  game: "Games",
  tool: "Tools",
};

/** Order in which categories appear on the hub. */
export const CATEGORY_ORDER: AppCategory[] = ["scorekeeper", "game", "tool"];

import { manifest as fiveCrowns } from "@/apps/five-crowns/manifest";
import { manifest as canasta } from "@/apps/canasta/manifest";
import { manifest as mexicanTrain } from "@/apps/mexican-train/manifest";
import { manifest as phase10 } from "@/apps/phase-10/manifest";
import { manifest as hearts } from "@/apps/hearts/manifest";
import { manifest as spades } from "@/apps/spades/manifest";
import { manifest as pinochle } from "@/apps/pinochle/manifest";
import { manifest as rummy } from "@/apps/rummy/manifest";
import { manifest as golf } from "@/apps/golf/manifest";
import { manifest as farkle } from "@/apps/farkle/manifest";
import { manifest as noisyRoom } from "@/apps/noisy-room/manifest";

export const APPS: AppManifest[] = [
  fiveCrowns,
  canasta,
  mexicanTrain,
  phase10,
  hearts,
  spades,
  pinochle,
  rummy,
  golf,
  farkle,
  noisyRoom,
];

export function getApp(slug: string): AppManifest | undefined {
  return APPS.find((app) => app.slug === slug);
}

export function visibleApps(): AppManifest[] {
  return APPS.filter((app) => !app.draft);
}

/**
 * Components are loaded through this map rather than the manifest so the
 * manifest stays a plain data module -- importable from Route Handlers and the
 * Edge proxy without dragging React components along with it.
 */
export const APP_COMPONENTS: Record<string, () => Promise<{ default: ComponentType }>> = {
  "five-crowns": () => import("@/apps/five-crowns/FiveCrowns"),
  canasta: () => import("@/apps/canasta/Canasta"),
  "mexican-train": () => import("@/apps/mexican-train/MexicanTrain"),
  "phase-10": () => import("@/apps/phase-10/Phase10"),
  hearts: () => import("@/apps/hearts/Hearts"),
  spades: () => import("@/apps/spades/Spades"),
  pinochle: () => import("@/apps/pinochle/Pinochle"),
  rummy: () => import("@/apps/rummy/Rummy"),
  golf: () => import("@/apps/golf/Golf"),
  farkle: () => import("@/apps/farkle/Farkle"),
  "noisy-room": () => import("@/apps/noisy-room/NoisyRoom"),
};
