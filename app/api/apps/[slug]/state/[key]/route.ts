import { NextResponse } from "next/server";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { readState, writeState, deleteState } from "@/lib/store";
import { getApp } from "@/lib/registry";

/**
 * Generic per-app persistence: GET / PUT / DELETE on an opaque JSON blob at
 * (current user, app slug, key).
 *
 * Every app on the site shares this one endpoint. A scorekeeper stores a game,
 * a puzzle stores a board, a tracker stores a list -- the server treats them
 * identically and only the app knows the shape.
 */

/** Reject unknown slugs so a caller can't use the store as scratch space. */
const badSlug = () => NextResponse.json({ error: "Unknown app" }, { status: 404 });

/** Keys are namespaced per app, but still bounded to keep the table sane. */
const KEY_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const badKey = () => NextResponse.json({ error: "Invalid key" }, { status: 400 });

/** Blobs are capped so one client cannot fill the disk. */
const MAX_BYTES = 256 * 1024;

type Params = { params: Promise<{ slug: string; key: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug, key } = await params;
  if (!getApp(slug)) return badSlug();
  if (!KEY_PATTERN.test(key)) return badKey();

  try {
    const userId = await requireUserId();
    const data = await readState(userId, slug, key);
    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { slug, key } = await params;
  if (!getApp(slug)) return badSlug();
  if (!KEY_PATTERN.test(key)) return badKey();

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BYTES) {
      return NextResponse.json({ error: "State too large" }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  try {
    const userId = await requireUserId();
    await writeState(userId, slug, key, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { slug, key } = await params;
  if (!getApp(slug)) return badSlug();
  if (!KEY_PATTERN.test(key)) return badKey();

  try {
    const userId = await requireUserId();
    await deleteState(userId, slug, key);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: "No identity" }, { status: 401 });
  }
  // The database is expected to be unavailable at times (it is ephemeral and
  // recreated on boot); the client falls back to local storage when it sees a 5xx.
  console.error("[state] request failed:", error);
  return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
}
