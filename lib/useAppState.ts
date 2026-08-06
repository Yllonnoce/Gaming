"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Persistent state for an app, backed by the server and mirrored to
 * localStorage.
 *
 * The server is authoritative when it answers. When it doesn't -- offline, or a
 * deploy that wiped the ephemeral database -- the local mirror keeps the app
 * fully usable and the next successful write re-seeds the server. The practical
 * effect is that a visitor can lose their history but never their game in
 * progress.
 */

export type SyncStatus = "loading" | "synced" | "saving" | "local";

type Options = {
  /** How long to coalesce rapid edits before writing to the server. */
  debounceMs?: number;
};

export function useAppState<T>(
  appSlug: string,
  key: string,
  initial: T,
  options: Options = {},
) {
  const { debounceMs = 600 } = options;

  const [state, setInternalState] = useState<T>(initial);
  const [status, setStatus] = useState<SyncStatus>("loading");

  const localKey = `gh:${appSlug}:${key}`;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Guards against a slow initial load overwriting edits the user already made. */
  const dirty = useRef(false);
  const mounted = useRef(true);

  // Hydrate: localStorage first so the UI fills in immediately, then the server
  // as the source of truth. Reading storage in an effect rather than during
  // render keeps the server and client markup identical.
  useEffect(() => {
    mounted.current = true;

    let cached: T | null = null;
    try {
      const raw = window.localStorage.getItem(localKey);
      if (raw) cached = JSON.parse(raw) as T;
    } catch {
      // Private-mode or corrupt entry; the server load below still applies.
    }
    if (cached !== null && !dirty.current) setInternalState(cached);

    (async () => {
      try {
        const response = await fetch(`/api/apps/${appSlug}/state/${key}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(String(response.status));

        const { data } = (await response.json()) as { data: T | null };
        if (!mounted.current) return;

        // A local edit made while this request was in flight wins; pushing the
        // server's older copy over it would look like the app undoing the user.
        if (dirty.current) {
          setStatus("synced");
          return;
        }
        if (data !== null) {
          setInternalState(data);
          writeLocal(localKey, data);
        }
        setStatus("synced");
      } catch {
        if (mounted.current) setStatus(cached !== null ? "local" : "synced");
      }
    })();

    return () => {
      mounted.current = false;
    };
    // Remounting for a different app or key is a genuine reload.
  }, [appSlug, key, localKey]);

  const push = useCallback(
    async (value: T) => {
      try {
        const response = await fetch(`/api/apps/${appSlug}/state/${key}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
        });
        if (!mounted.current) return;
        setStatus(response.ok ? "synced" : "local");
      } catch {
        if (mounted.current) setStatus("local");
      }
    },
    [appSlug, key],
  );

  const setState = useCallback(
    (update: T | ((previous: T) => T)) => {
      dirty.current = true;
      setInternalState((previous) => {
        const next =
          typeof update === "function" ? (update as (p: T) => T)(previous) : update;

        // Local mirror is written synchronously; a crash or refresh between now
        // and the debounced server write must not lose the move.
        writeLocal(localKey, next);
        setStatus("saving");

        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void push(next), debounceMs);

        return next;
      });
    },
    [localKey, push, debounceMs],
  );

  /** Discard both copies and return to the initial value. */
  const reset = useCallback(() => {
    dirty.current = true;
    setInternalState(initial);
    try {
      window.localStorage.removeItem(localKey);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
    if (timer.current) clearTimeout(timer.current);
    setStatus("saving");
    void fetch(`/api/apps/${appSlug}/state/${key}`, { method: "DELETE" })
      .then((response) => mounted.current && setStatus(response.ok ? "synced" : "local"))
      .catch(() => mounted.current && setStatus("local"));
    // `initial` is intentionally not a dependency: callers pass an object
    // literal, and depending on it would rebuild this callback every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appSlug, key, localKey]);

  // Flush a pending write when the tab is hidden or closed, which is when a
  // debounced save would otherwise be dropped.
  useEffect(() => {
    const flush = () => {
      if (!timer.current) return;
      clearTimeout(timer.current);
      timer.current = null;
      const raw = readLocalRaw(localKey);
      if (!raw) return;
      // keepalive lets the request outlive the page.
      void fetch(`/api/apps/${appSlug}/state/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: raw,
        keepalive: true,
      }).catch(() => {});
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [appSlug, key, localKey]);

  return { state, setState, status, reset };
}

function writeLocal(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private mode; the server copy is still attempted.
  }
}

function readLocalRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
