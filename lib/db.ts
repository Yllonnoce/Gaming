import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

/**
 * SQLite access, via libSQL.
 *
 * libSQL speaks the same SQLite dialect against either a local file or a hosted
 * Turso database, and exposes one async API for both. That keeps the migration
 * path open: today DATABASE_URL points at a file, and switching to hosted
 * storage later is a URL change rather than a rewrite.
 *
 * Note that on Render's default filesystem this file is ephemeral -- it is
 * erased on every deploy and restart. That is a deliberate, accepted tradeoff
 * for now; the client mirrors state to localStorage so a wipe costs a user
 * their history but never their in-progress game.
 */

const DEFAULT_URL = "file:./data/gaming.db";

function connect(): Client {
  const url = process.env.DATABASE_URL ?? DEFAULT_URL;

  // libSQL creates the database file but not its parent directory.
  if (url.startsWith("file:")) {
    const path = url.slice("file:".length);
    if (path.includes("/")) mkdirSync(dirname(path), { recursive: true });
  }

  return createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id           TEXT PRIMARY KEY,
     created_at   INTEGER NOT NULL,
     last_seen_at INTEGER NOT NULL
   )`,
  /**
   * One row per (user, app, key). Apps get an opaque JSON blob rather than
   * bespoke tables, so adding a scorekeeper, a playable game, or a utility
   * needs no migration -- only the app's own TypeScript types.
   */
  `CREATE TABLE IF NOT EXISTS app_state (
     user_id    TEXT    NOT NULL,
     app_slug   TEXT    NOT NULL,
     state_key  TEXT    NOT NULL,
     data       TEXT    NOT NULL,
     updated_at INTEGER NOT NULL,
     PRIMARY KEY (user_id, app_slug, state_key),
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
   )`,
  `CREATE INDEX IF NOT EXISTS idx_app_state_lookup
     ON app_state (user_id, app_slug, updated_at DESC)`,
];

/**
 * Next's dev server re-evaluates modules on hot reload, so the client and the
 * schema promise are cached on globalThis to avoid reconnecting and re-running
 * migrations on every edit.
 */
const globalCache = globalThis as unknown as {
  __ghClient?: Client;
  __ghSchema?: Promise<Client>;
};

export function db(): Client {
  globalCache.__ghClient ??= connect();
  return globalCache.__ghClient;
}

/** Resolves once the schema exists. Every data helper awaits this first. */
export function ready(): Promise<Client> {
  globalCache.__ghSchema ??= (async () => {
    const client = db();
    for (const statement of SCHEMA) await client.execute(statement);
    return client;
  })().catch((error) => {
    // Don't cache a failed init, or the process can never recover from a
    // transient startup error.
    globalCache.__ghSchema = undefined;
    throw error;
  });
  return globalCache.__ghSchema;
}
