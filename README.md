# Game Night

A small collection of games, scorekeepers, and utilities sharing one site, one
look, and one storage layer. Each visitor's data is kept separate from everyone
else's without anyone having to create an account.

First app: **Five Crowns** — an eleven-round scorekeeper.

## Running it

```bash
npm install
npm run dev
```

No configuration needed for development. The database is created on first use
at `data/gaming.db`, and the cookie secret falls back to a development default.

| Command             | What it does                        |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Dev server on :3000                 |
| `npm run build`     | Production build                    |
| `npm start`         | Serve the production build          |
| `npm run typecheck` | `tsc --noEmit`                      |
| `npm run lint`      | ESLint                              |

## How identity works

There is no login. On a visitor's first request, [`proxy.ts`](proxy.ts) mints a
random UUID, signs it with an HMAC, and sets it as an httpOnly cookie. Every
subsequent request carries it, and verifying it is a local hash comparison —
no session table, no round-trip.

Separation between visitors is enforced server-side: every query in
[`lib/store.ts`](lib/store.ts) is scoped by a `userId` that comes from the
*verified* cookie and never from anything the client sends. A visitor cannot
read another's data even by guessing their id, because they cannot produce a
valid signature for it.

The tradeoff is that the cookie *is* the account — clearing cookies or
switching devices yields a fresh, empty one. This upgrades cleanly: adding real
credentials later means attaching an email to an existing `userId`, so a user's
data carries over rather than starting fresh.

`IDENTITY_SECRET` must be set in production; the app refuses to boot without it,
because an unset secret would silently reissue every visitor a new identity on
each deploy.

## How storage works

One generic endpoint serves every app:

```
GET | PUT | DELETE  /api/apps/<slug>/state/<key>
```

It stores an opaque JSON blob at `(user, app, key)`. A scorekeeper saves a game,
a puzzle saves a board, a tracker saves a list — the server treats them
identically, and only the app knows the shape. Adding an app therefore needs no
migration.

On the client, [`useAppState`](lib/useAppState.ts) wraps this: it reads from
localStorage first for an instant paint, then from the server as the source of
truth, and writes to both (debounced to the server, immediate to localStorage,
flushed on tab hide). If the server is unreachable it keeps working locally and
says so in the UI.

### Data is currently ephemeral

On Render's free plan the filesystem is wiped on every deploy and restart, so
`data/gaming.db` does not survive. This is a deliberate, temporary choice. The
localStorage mirror means a visitor can lose their *history* but never their
*in-progress game*.

Two ways to make it durable, neither requiring code changes:

1. **Turso** — create a free hosted libSQL database and set `DATABASE_URL` to
   its `libsql://` URL plus `DATABASE_AUTH_TOKEN`. Works on the free plan.
2. **Persistent disk** — move to a Render Starter instance, uncomment the `disk`
   block in [`render.yaml`](render.yaml), and point `DATABASE_URL` at the mount
   path. Note that disks limit the service to one instance and add brief
   downtime per deploy.

## Adding an app

Three steps, no routing or backend work.

**1.** Create `apps/<slug>/manifest.ts`:

```ts
import type { AppManifest } from "@/lib/registry";

export const manifest: AppManifest = {
  slug: "yahtzee",
  title: "Yahtzee",
  blurb: "Thirteen boxes, one scorecard.",
  category: "scorekeeper", // | "game" | "tool"
  icon: "🎲",
  accent: "text-gold",
};
```

**2.** Create `apps/<slug>/Yahtzee.tsx` as a client component. Use
`useAppState` for anything that should persist:

```tsx
"use client";
import { useAppState } from "@/lib/useAppState";

export default function Yahtzee() {
  const { state, setState, status, reset } = useAppState("yahtzee", "current", INITIAL);
  // ...
}
```

**3.** Register it in [`lib/registry.ts`](lib/registry.ts) — add the manifest to
`APPS` and the dynamic import to `APP_COMPONENTS`. It now appears on the hub at
`/`, is routed at `/apps/<slug>`, and has storage scoped to each visitor.

Set `draft: true` on the manifest to keep it off the hub while it's unfinished;
it stays reachable by URL.

## Layout

```
app/
  page.tsx                              hub, driven by the registry
  apps/[slug]/page.tsx                  one route hosts every app
  api/apps/[slug]/state/[key]/route.ts  generic per-user storage
apps/
  five-crowns/                          manifest + component
lib/
  identity.ts     cookie signing and verification (Edge-safe)
  session.ts      current user, server-side
  db.ts           libSQL connection and schema
  store.ts        user-scoped queries
  registry.ts     the app catalogue
  useAppState.ts  client persistence hook
  site.ts         site name and tagline
proxy.ts          issues the identity cookie
render.yaml       Render deploy config
```

## Deploying to Render

Push to GitHub, then create a Blueprint from `render.yaml`. It provisions a free
web service, generates `IDENTITY_SECRET` automatically, and builds with
`npm ci && npm run build`.

The free instance sleeps after 15 minutes idle, so the first request after a
quiet period takes roughly 30 seconds.

## License

See [LICENSE](LICENSE).
