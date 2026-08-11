/**
 * Reader-adjustable text size.
 *
 * Works exactly like the theme: an attribute on <html>, set before first paint
 * by the boot script and persisted in localStorage. The CSS in globals.css
 * scales the root font-size, and because the whole layout is rem-based, text
 * and spacing grow together like browser zoom rather than text overflowing a
 * fixed frame.
 */

export const FONT_SIZE_IDS = ["m", "l", "xl", "xxl"] as const;

export type FontSizeId = (typeof FONT_SIZE_IDS)[number];

export const DEFAULT_FONT_SIZE: FontSizeId = "m";

export const FONT_SIZE_STORAGE_KEY = "gh:fontsize";

export type FontSize = {
  id: FontSizeId;
  label: string;
  /** Size of the "A" shown on the picker button, in px. */
  preview: number;
};

export const FONT_SIZES: FontSize[] = [
  { id: "m", label: "Default text", preview: 12 },
  { id: "l", label: "Large text", preview: 14 },
  { id: "xl", label: "Extra large text", preview: 16 },
  { id: "xxl", label: "Largest text", preview: 19 },
];

export function isFontSizeId(value: unknown): value is FontSizeId {
  return typeof value === "string" && (FONT_SIZE_IDS as readonly string[]).includes(value);
}
