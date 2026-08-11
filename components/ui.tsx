"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes } from "react";
import type { SyncStatus } from "@/lib/useAppState";

/**
 * Shared UI primitives.
 *
 * Every app on the site draws from these so the theme is defined once. An app
 * that needs a one-off look should extend a primitive rather than hand-rolling
 * its own button, or the two drift the first time the palette changes.
 */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base =
    "w-full rounded-lg font-display text-sm font-bold uppercase tracking-[0.12em] transition disabled:opacity-40";
  const variants = {
    primary: "bg-accent py-3.5 text-on-accent hover:bg-accent-soft disabled:hover:bg-accent",
    ghost: "border border-accent/50 py-3 text-accent hover:bg-accent/10",
  };
  return (
    <button type="button" className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-w-0 flex-1 rounded-lg border border-muted/35 bg-well/60 px-3 py-2.5 text-base text-ink outline-none focus:border-accent ${className}`}
      {...props}
    />
  );
}

/** The small square button used for removing a row. */
export function IconButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`w-11 shrink-0 rounded-lg border border-muted/35 text-lg text-muted transition enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-30 ${className}`}
      {...props}
    />
  );
}

export type StandingRow = { name: string; total: number };

/**
 * Ranked totals. Callers sort the rows themselves, because "winning" runs in
 * opposite directions across games -- lowest wins at Five Crowns, highest at
 * Canasta -- and this component should not have to know which.
 */
export function Standings({
  rows,
  bestTotal,
  markLeader = false,
}: {
  rows: StandingRow[];
  bestTotal: number;
  markLeader?: boolean;
}) {
  return (
    <ol>
      {rows.map((row, index) => {
        const leading = row.total === bestTotal;
        return (
          <li
            key={row.name}
            className={`flex items-baseline gap-2.5 py-1.5 text-[1.0625rem] ${leading ? "text-accent" : ""}`}
          >
            <span className="w-[18px] shrink-0 text-[0.8125rem] text-muted">{index + 1}</span>
            <span className="flex-1">
              {markLeader && leading && <span aria-hidden="true">♛ </span>}
              {row.name}
            </span>
            <span className="font-display text-lg font-bold">{row.total}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function SaveIndicator({ status }: { status: SyncStatus }) {
  const text: Record<SyncStatus, string> = {
    loading: "Loading…",
    saving: "Saving…",
    synced: "Saved",
    // Surfaced honestly rather than hidden: the game is safe, but only here.
    local: "Saved on this device only",
  };
  return (
    <span role="status" aria-live="polite">
      {text[status]}
    </span>
  );
}

/** Save state, plus the escape hatch to abandon the current game. */
export function FooterControls({
  status,
  onReset,
  confirmText = "Abandon this game and start over?",
}: {
  status: SyncStatus;
  onReset?: () => void;
  confirmText?: string;
}) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3 text-sm text-muted/70">
      <SaveIndicator status={status} />
      {onReset && (
        <button
          type="button"
          className="underline underline-offset-2 transition hover:text-accent"
          onClick={() => {
            if (confirm(confirmText)) onReset();
          }}
        >
          Start over
        </button>
      )}
    </div>
  );
}
