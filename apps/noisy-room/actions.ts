"use server";

import { revalidatePath } from "next/cache";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { addSideRoom, countSideRooms, removeSideRoom } from "@/lib/rooms";
import { isGroupId, isRoomName, toGroupId, MAX_LABEL_LENGTH, MAX_SIDE_ROOMS } from "./names";
import { roomPath } from "./links";

/**
 * Mutations for a room page. Reachable by anyone who can POST, so every input
 * is re-validated here regardless of what the form allowed.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addSideRoomAction(room: string, label: string): Promise<ActionResult> {
  if (!isRoomName(room)) return { ok: false, error: "That room does not exist." };

  const trimmed = label.trim().slice(0, MAX_LABEL_LENGTH);
  const id = toGroupId(trimmed);
  if (!trimmed || !isGroupId(id)) {
    return { ok: false, error: "Give the side room a name with at least one letter or number." };
  }

  try {
    const userId = await requireUserId();
    if ((await countSideRooms(room)) >= MAX_SIDE_ROOMS) {
      return { ok: false, error: `A room can have at most ${MAX_SIDE_ROOMS} side rooms.` };
    }
    await addSideRoom(room, id, trimmed, userId);
  } catch (error) {
    return { ok: false, error: describe(error) };
  }

  revalidatePath(roomPath(room));
  return { ok: true };
}

export async function removeSideRoomAction(room: string, id: string): Promise<ActionResult> {
  if (!isRoomName(room) || !isGroupId(id)) return { ok: false, error: "Nothing to remove." };

  try {
    const userId = await requireUserId();
    const removed = await removeSideRoom(room, id, userId);
    if (!removed) {
      return { ok: false, error: "Only whoever made a side room, or started the room, can remove it." };
    }
  } catch (error) {
    return { ok: false, error: describe(error) };
  }

  revalidatePath(roomPath(room));
  return { ok: true };
}

function describe(error: unknown): string {
  if (error instanceof UnauthorizedError) return "Reload the page and try again.";
  console.error("[noisy-room] action failed:", error);
  return "Could not save that right now. The room still works; try again in a moment.";
}
