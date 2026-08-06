/**
 * Device-scoped identity.
 *
 * Every visitor is silently issued an account on their first request: a random
 * UUID stored in an httpOnly cookie, signed with an HMAC so it cannot be forged
 * or swapped for someone else's id. There is no login, no password, and no
 * round-trip to a session table -- the cookie itself carries the identity, and
 * verifying it is a local hash comparison.
 *
 * The tradeoff is that the cookie *is* the account: clearing cookies or moving
 * to another browser yields a fresh, empty one. When real credentials are added
 * later, they attach to an existing userId rather than replacing it, so a
 * user's data carries over instead of starting over.
 */

const COOKIE_NAME = "gh_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 months, the browser cap

/**
 * In production an unset secret would silently let every deploy invalidate all
 * identities, so we fail loudly instead. Development gets a fixed fallback so
 * `npm run dev` works with no setup.
 */
function secret(): string {
  const s = process.env.IDENTITY_SECRET;
  if (s && s.length > 0) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "IDENTITY_SECRET is required in production. Generate one with: openssl rand -hex 32",
    );
  }
  return "dev-only-insecure-secret-do-not-use-in-production";
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * WebCrypto rather than node:crypto so this module runs unchanged in the Edge
 * runtime, where the proxy that issues the cookie executes.
 */
async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toBase64Url(mac);
}

/** Constant-time compare, so signature checking cannot be timing-attacked. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type IdentityCookie = { name: string; value: string; maxAge: number };

/** Mint a brand-new signed identity. */
export async function createIdentity(): Promise<{ userId: string; cookie: IdentityCookie }> {
  const userId = crypto.randomUUID();
  const signature = await sign(userId);
  return {
    userId,
    cookie: { name: COOKIE_NAME, value: `${userId}.${signature}`, maxAge: COOKIE_MAX_AGE },
  };
}

/**
 * Recover the userId from a raw cookie value, or null if it is absent, damaged,
 * or signed with a different secret. Callers treat null as "issue a new one".
 */
export async function readIdentity(raw: string | undefined): Promise<string | null> {
  if (!raw) return null;
  const separator = raw.lastIndexOf(".");
  if (separator <= 0) return null;

  const userId = raw.slice(0, separator);
  const signature = raw.slice(separator + 1);
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;

  return safeEqual(await sign(userId), signature) ? userId : null;
}

export { COOKIE_NAME, COOKIE_MAX_AGE };
