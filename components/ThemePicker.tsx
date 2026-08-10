"use client";

import { useSyncExternalStore } from "react";
import { THEMES } from "@/lib/themes";
import { subscribeTheme, getTheme, getServerTheme, applyTheme } from "@/lib/theme-client";

/**
 * Six swatches, applied instantly.
 *
 * The active theme lives on `<html data-theme>` rather than in component state,
 * because the boot script sets it before React exists. Reading it through
 * useSyncExternalStore keeps the two in step -- including when another tab
 * changes it -- without mirroring it into state.
 */
export function ThemePicker() {
  const active = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Colour theme">
      {THEMES.map((theme) => {
        const selected = theme.id === active;
        return (
          <button
            key={theme.id}
            type="button"
            title={theme.name}
            aria-label={theme.name}
            aria-pressed={selected}
            onClick={() => applyTheme(theme.id)}
            className={`h-6 w-6 rounded-full border transition ${
              selected
                ? "border-accent ring-2 ring-accent/45"
                : "border-muted/40 hover:border-accent/70"
            }`}
            style={{
              // Literal colours, not tokens: each swatch shows its own palette
              // rather than the one currently applied.
              background: `linear-gradient(135deg, ${theme.swatch.surface} 0 50%, ${theme.swatch.accent} 50% 100%)`,
            }}
          />
        );
      })}
    </div>
  );
}
