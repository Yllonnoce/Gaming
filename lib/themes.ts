/**
 * Site themes.
 *
 * A theme is purely a set of CSS custom properties defined in globals.css; this
 * module is the catalogue the picker renders from and the allow-list the
 * no-flash boot script validates against. Adding a theme means adding a block
 * of variables there and an entry here -- no component changes.
 */

export const THEME_IDS = [
  "midnight",
  "forest",
  "sapphire",
  "ember",
  "slate",
  "parchment",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "midnight";

/** Read by the boot script before paint, so it cannot be a cookie. */
export const THEME_STORAGE_KEY = "gh:theme";

export type Theme = {
  id: ThemeId;
  name: string;
  /** Literal colours for the picker swatch; mirrors the palette in globals.css. */
  swatch: { surface: string; accent: string };
};

// Ids are storage keys and must stay stable across redesigns; the display
// names describe the current look and are free to change.
export const THEMES: Theme[] = [
  { id: "midnight", name: "Lavender", swatch: { surface: "#ece3f7", accent: "#6b3fa0" } },
  { id: "forest", name: "Meadow", swatch: { surface: "#e2efdf", accent: "#2f6b40" } },
  { id: "sapphire", name: "Sky", swatch: { surface: "#ddebf8", accent: "#1d5c94" } },
  { id: "ember", name: "Peach", swatch: { surface: "#f8e5d4", accent: "#a34a17" } },
  { id: "slate", name: "Mist", swatch: { surface: "#e5eaef", accent: "#176a62" } },
  { id: "parchment", name: "Parchment", swatch: { surface: "#f3ead6", accent: "#8c2f39" } },
];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (THEME_IDS as readonly string[]).includes(value);
}

import { FONT_SIZE_IDS, FONT_SIZE_STORAGE_KEY } from "./fontsize";

/**
 * Runs before first paint to avoid a flash of the default palette or a layout
 * jump to the chosen text size.
 *
 * Inlined into <head> as a blocking script: it must execute before the browser
 * paints the body, which rules out doing this in React. Both values are checked
 * against allow-lists so a hand-edited localStorage entry cannot put arbitrary
 * text into the DOM.
 */
export const DISPLAY_BOOT_SCRIPT = `
try {
  var t = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
  if (${JSON.stringify(THEME_IDS)}.indexOf(t) > -1) document.documentElement.dataset.theme = t;
  var f = localStorage.getItem(${JSON.stringify(FONT_SIZE_STORAGE_KEY)});
  if (${JSON.stringify(FONT_SIZE_IDS)}.indexOf(f) > -1) document.documentElement.dataset.fontsize = f;
} catch (e) {}
`.trim();
