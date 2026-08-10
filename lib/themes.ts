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

export const THEMES: Theme[] = [
  { id: "midnight", name: "Midnight", swatch: { surface: "#241539", accent: "#c9a227" } },
  { id: "forest", name: "Forest", swatch: { surface: "#15291d", accent: "#e0a83c" } },
  { id: "sapphire", name: "Sapphire", swatch: { surface: "#12274a", accent: "#6fc3e8" } },
  { id: "ember", name: "Ember", swatch: { surface: "#331710", accent: "#f0803c" } },
  { id: "slate", name: "Slate", swatch: { surface: "#262d36", accent: "#4fd1c5" } },
  { id: "parchment", name: "Parchment", swatch: { surface: "#f3ead6", accent: "#8c2f39" } },
];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (THEME_IDS as readonly string[]).includes(value);
}

/**
 * Runs before first paint to avoid a flash of the default palette.
 *
 * Inlined into <head> as a blocking script: it must execute before the browser
 * paints the body background, which rules out doing this in React. The value is
 * checked against the allow-list so a hand-edited localStorage entry cannot put
 * arbitrary text into the DOM.
 */
export const THEME_BOOT_SCRIPT = `
try {
  var t = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
  if (${JSON.stringify(THEME_IDS)}.indexOf(t) > -1) document.documentElement.dataset.theme = t;
} catch (e) {}
`.trim();
