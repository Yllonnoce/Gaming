import { ready } from "./db";

/**
 * Noisy Room storage.
 *
 * Unlike app_state, nothing here is private to one visitor: anyone holding a
 * room's link can read it and add side rooms to it. Deletion is the only
 * privileged operation, limited to whoever created the side room or the room.
 * Callers pass a userId taken from the verified cookie, never from input.
 */

export type Room = { name: string; createdBy: string; createdAt: number };

export type SideRoom = {
  /** The VDO.Ninja group id: what Comms shows on its button. */
  id: string;
  /** The name as typed, shown in our own UI. */
  label: string;
  createdBy: string;
  createdAt: number;
};

/**
 * Record a visit, creating the room on first sight. The first visitor is the
 * creator: the hub page sends whoever pressed "Start a room" straight here, so
 * that is who it will be in practice.
 */
export async function touchRoom(name: string, userId: string): Promise<Room> {
  const client = await ready();
  const now = Date.now();
  await client.execute({
    sql: `INSERT INTO rooms (name, created_by, created_at, last_seen_at) VALUES (?, ?, ?, ?)
          ON CONFLICT(name) DO UPDATE SET last_seen_at = excluded.last_seen_at`,
    args: [name, userId, now, now],
  });
  const result = await client.execute({
    sql: `SELECT name, created_by, created_at FROM rooms WHERE name = ?`,
    args: [name],
  });
  const row = result.rows[0];
  return {
    name: String(row.name),
    createdBy: String(row.created_by),
    createdAt: Number(row.created_at),
  };
}

export async function listSideRooms(room: string): Promise<SideRoom[]> {
  const client = await ready();
  const result = await client.execute({
    sql: `SELECT id, label, created_by, created_at FROM side_rooms
          WHERE room = ? ORDER BY created_at ASC`,
    args: [room],
  });
  return result.rows.map((row) => ({
    id: String(row.id),
    label: String(row.label),
    createdBy: String(row.created_by),
    createdAt: Number(row.created_at),
  }));
}

export async function countSideRooms(room: string): Promise<number> {
  const client = await ready();
  const result = await client.execute({
    sql: `SELECT COUNT(*) AS n FROM side_rooms WHERE room = ?`,
    args: [room],
  });
  return Number(result.rows[0]?.n ?? 0);
}

/** Adding an id that already exists is a no-op rather than an error. */
export async function addSideRoom(
  room: string,
  id: string,
  label: string,
  userId: string,
): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: `INSERT OR IGNORE INTO side_rooms (room, id, label, created_by, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [room, id, label, userId, Date.now()],
  });
}

/**
 * Only the side room's creator or the room's creator may remove it. Returns
 * whether a row was actually deleted, so the caller can report a refusal.
 */
export async function removeSideRoom(room: string, id: string, userId: string): Promise<boolean> {
  const client = await ready();
  const result = await client.execute({
    sql: `DELETE FROM side_rooms
          WHERE room = ? AND id = ?
            AND (created_by = ? OR EXISTS (
              SELECT 1 FROM rooms WHERE rooms.name = side_rooms.room AND rooms.created_by = ?
            ))`,
    args: [room, id, userId, userId],
  });
  return result.rowsAffected > 0;
}
