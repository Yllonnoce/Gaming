"use client";

import { useSyncExternalStore } from "react";
import { FONT_SIZES } from "@/lib/fontsize";
import {
  subscribeFontSize,
  getFontSize,
  getServerFontSize,
  applyFontSize,
} from "@/lib/fontsize-client";

/**
 * Four "A" buttons at graduated sizes, applied instantly and remembered.
 * Reads the active size from <html data-fontsize> through the external store,
 * the same pattern as the theme picker.
 */
export function FontSizePicker() {
  const active = useSyncExternalStore(subscribeFontSize, getFontSize, getServerFontSize);

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Text size">
      {FONT_SIZES.map((size) => {
        const selected = size.id === active;
        return (
          <button
            key={size.id}
            type="button"
            title={size.label}
            aria-label={size.label}
            aria-pressed={selected}
            onClick={() => applyFontSize(size.id)}
            className={`flex h-7 w-7 items-center justify-center rounded-md border font-display font-bold transition ${
              selected
                ? "border-accent bg-accent/15 text-accent"
                : "border-muted/40 text-muted hover:border-accent/70 hover:text-accent"
            }`}
            // Fixed px on purpose: the previews show the size you'd get, so
            // they must not scale with the very setting they control.
            style={{ fontSize: `${size.preview}px` }}
          >
            A
          </button>
        );
      })}
    </div>
  );
}
