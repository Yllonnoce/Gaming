import { DEFAULT_THEME, THEME_STORAGE_KEY, isThemeId, type ThemeId } from "./themes";

/**
 * The active theme as an external store.
 *
 * `<html data-theme>` is the single source of truth while the page is open --
 * the boot script sets it before React exists, so React has to read it rather
 * than own it. Exposing it through subscribe/getSnapshot lets components use
 * `useSyncExternalStore` instead of mirroring it into component state.
 */

const listeners = new Set<() => void>();
let watchingStorage = false;

function notify() {
  for (const listener of listeners) listener();
}

/** Another tab changed the theme; match it so every open tab stays in step. */
function onStorage(event: StorageEvent) {
  if (event.key !== THEME_STORAGE_KEY) return;
  document.documentElement.dataset.theme = isThemeId(event.newValue)
    ? event.newValue
    : DEFAULT_THEME;
  notify();
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  if (!watchingStorage) {
    window.addEventListener("storage", onStorage);
    watchingStorage = true;
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && watchingStorage) {
      window.removeEventListener("storage", onStorage);
      watchingStorage = false;
    }
  };
}

export function getTheme(): ThemeId {
  const value = document.documentElement.dataset.theme;
  return isThemeId(value) ? value : DEFAULT_THEME;
}

/**
 * The server cannot know the visitor's choice, so it always renders the default
 * and the boot script corrects the DOM before paint.
 */
export function getServerTheme(): ThemeId {
  return DEFAULT_THEME;
}

export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // Private mode: the theme still applies for this page's lifetime.
  }
  notify();
}
