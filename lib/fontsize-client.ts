import {
  DEFAULT_FONT_SIZE,
  FONT_SIZE_STORAGE_KEY,
  isFontSizeId,
  type FontSizeId,
} from "./fontsize";

/**
 * The active text size as an external store, mirroring lib/theme-client.ts:
 * `<html data-fontsize>` is the source of truth (the boot script sets it before
 * React exists), components read it via useSyncExternalStore, and the storage
 * event keeps every open tab in step.
 */

const listeners = new Set<() => void>();
let watchingStorage = false;

function notify() {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key !== FONT_SIZE_STORAGE_KEY) return;
  applyToDom(isFontSizeId(event.newValue) ? event.newValue : DEFAULT_FONT_SIZE);
  notify();
}

function applyToDom(id: FontSizeId) {
  if (id === DEFAULT_FONT_SIZE) {
    // The default carries no attribute, matching what the boot script does.
    delete document.documentElement.dataset.fontsize;
  } else {
    document.documentElement.dataset.fontsize = id;
  }
}

export function subscribeFontSize(listener: () => void): () => void {
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

export function getFontSize(): FontSizeId {
  const value = document.documentElement.dataset.fontsize;
  return isFontSizeId(value) ? value : DEFAULT_FONT_SIZE;
}

export function getServerFontSize(): FontSizeId {
  return DEFAULT_FONT_SIZE;
}

export function applyFontSize(id: FontSizeId): void {
  applyToDom(id);
  try {
    window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, id);
  } catch {
    // Private mode: the size still applies for this page's lifetime.
  }
  notify();
}
