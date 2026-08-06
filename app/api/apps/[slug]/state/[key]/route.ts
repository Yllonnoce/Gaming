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

/**
 * Every response here is specific to one visitor's cookie, so it must never be
 * held in a shared cache. `private, no-store` keeps CDNs and proxies from
 * retaining it at all, and `Vary: Cookie` means any cache that ignores that
 * still cannot serve one visitor's body to another.
 *
 * Without these, adding a CDN in front of the app later would silently turn
 * this endpoint into a cross-user leak.
 */
function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      Vary: "Cookie",
    },
  });
}

/** Reject unknown slugs so a caller can't use the store as scratch space. */
const badSlug = () => json({ error: "Unknown app" }, 404);

/** Keys are namespaced per app, but still bounded to keep the table sane. */
const KEY_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const badKey = () => json({ error: "Invalid key" }, 400);

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
    return json({ data });
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
      return json({ error: "State too large" }, 413);
    }
    body = JSON.parse(text);
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }

  try {
    const userId = await requireUserId();
    await writeState(userId, slug, key, body);
    return json({ ok: true });
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
    return json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return json({ error: "No identity" }, 401);
  }
  // The database is expected to be unavailable at times (it is ephemeral and
  // recreated on boot); the client falls back to local storage when it sees a 5xx.
  console.error("[state] request failed:", error);
  return json({ error: "Storage unavailable" }, 503);
}
