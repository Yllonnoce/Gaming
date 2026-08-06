import { ready } from "./db";

/**
 * Every read and write is scoped by userId, which the caller obtains from the
 * verified identity cookie and never from client-supplied input. That single
 * rule is what keeps one visitor's data invisible to another.
 */

/** Record a visit, creating the user row on first sight. */
export async function touchUser(userId: string): Promise<void> {
  const client = await ready();
  const now = Date.now();
  await client.execute({
    sql: `INSERT INTO users (id, created_at, last_seen_at) VALUES (?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET last_seen_at = excluded.last_seen_at`,
    args: [userId, now, now],
  });
}

export async function readState<T = unknown>(
  userId: string,
  appSlug: string,
  stateKey: string,
): Promise<T | null> {
  const client = await ready();
  const result = await client.execute({
    sql: `SELECT data FROM app_state
          WHERE user_id = ? AND app_slug = ? AND state_key = ?`,
    args: [userId, appSlug, stateKey],
  });

  const row = result.rows[0];
  if (!row) return null;

  try {
    return JSON.parse(String(row.data)) as T;
  } catch {
    // A corrupt blob shouldn't take down the app; treat it as absent.
    return null;
  }
}

export async function writeState(
  userId: string,
  appSlug: string,
  stateKey: string,
  data: unknown,
): Promise<void> {
  const client = await ready();
  // The user row must exist for the foreign key to hold; a visitor can have a
  // valid cookie from a previous deploy whose database has since been wiped.
  await touchUser(userId);
  await client.execute({
    sql: `INSERT INTO app_state (user_id, app_slug, state_key, data, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(user_id, app_slug, state_key)
          DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    args: [userId, appSlug, stateKey, JSON.stringify(data), Date.now()],
  });
}

export async function deleteState(
  userId: string,
  appSlug: string,
  stateKey: string,
): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: `DELETE FROM app_state
          WHERE user_id = ? AND app_slug = ? AND state_key = ?`,
    args: [userId, appSlug, stateKey],
  });
}

/** Every key an app has stored for this user, most recently updated first. */
export async function listStateKeys(
  userId: string,
  appSlug: string,
): Promise<{ stateKey: string; updatedAt: number }[]> {
  const client = await ready();
  const result = await client.execute({
    sql: `SELECT state_key, updated_at FROM app_state
          WHERE user_id = ? AND app_slug = ?
          ORDER BY updated_at DESC`,
    args: [userId, appSlug],
  });
  return result.rows.map((row) => ({
    stateKey: String(row.state_key),
    updatedAt: Number(row.updated_at),
  }));
}
