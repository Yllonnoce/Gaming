import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ThemePicker } from "@/components/ThemePicker";
import { FontSizePicker } from "@/components/FontSizePicker";
import { RulesPanel } from "@/components/RulesPanel";
import { RoomView } from "@/apps/noisy-room/RoomView";
import { isRoomName } from "@/apps/noisy-room/names";
import { rules } from "@/apps/noisy-room/rules";
import { currentUserId } from "@/lib/session";
import { touchRoom, listSideRooms, type SideRoom } from "@/lib/rooms";

/**
 * A Noisy Room's shared page: what the QR code points at.
 *
 * Any well-formed name renders, whether or not the database has heard of it.
 * The database is ephemeral in production, and a code that someone printed or
 * bookmarked must keep working after a deploy wipes it; the room simply comes
 * back with an empty side-room list.
 */

type Props = { params: Promise<{ room: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { room } = await params;
  return { title: `Noisy Room · ${room}`, description: "Scan to hear the table in your headphones." };
}

export default async function RoomPage({ params }: Props) {
  const { room } = await params;
  if (!isRoomName(room)) notFound();

  const viewerId = await currentUserId();

  let sideRooms: SideRoom[] = [];
  let hostId: string | null = null;
  let storageOk = false;
  try {
    if (viewerId) {
      const record = await touchRoom(room, viewerId);
      hostId = record.createdBy;
    }
    sideRooms = await listSideRooms(room);
    storageOk = true;
  } catch (error) {
    console.error("[noisy-room] storage unavailable:", error);
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-6">
      <nav className="mb-4 flex items-center justify-between gap-4">
        <Link
          href="/apps/noisy-room"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-accent"
        >
          <span aria-hidden="true">←</span> Noisy Room
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <a
            href="#rules"
            className="text-sm text-muted underline underline-offset-2 transition hover:text-accent"
          >
            How it works
          </a>
          <ThemePicker />
          <FontSizePicker />
        </div>
      </nav>
      <RoomView
        room={room}
        sideRooms={sideRooms}
        viewerId={viewerId}
        hostId={hostId}
        storageOk={storageOk}
      />
      <RulesPanel rules={rules} title="Noisy Room" />
    </main>
  );
}
