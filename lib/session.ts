import { cookies } from "next/headers";
import { COOKIE_NAME, readIdentity } from "./identity";

/**
 * Server-side access to the current visitor's id.
 *
 * The proxy guarantees a valid cookie is present on every non-static request,
 * so in practice this returns a userId. It still returns null rather than
 * throwing for the edge cases the proxy cannot cover -- a request that bypassed
 * the matcher, or a cookie invalidated by a secret rotation mid-session.
 */
export async function currentUserId(): Promise<string | null> {
  const store = await cookies();
  return readIdentity(store.get(COOKIE_NAME)?.value);
}

/**
 * For Route Handlers, where the absence of an identity is a real 401 rather
 * than something to render around.
 */
export async function requireUserId(): Promise<string> {
  const userId = await currentUserId();
  if (!userId) throw new UnauthorizedError();
  return userId;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("No valid identity cookie on this request");
    this.name = "UnauthorizedError";
  }
}
