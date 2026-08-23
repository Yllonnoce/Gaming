# Game Night

A small collection of games, scorekeepers, and utilities sharing one site, one
look, and one storage layer. Each visitor's data is kept separate from everyone
else's without anyone having to create an account.

Apps so far:

- **Five Crowns** — eleven rounds, climbing wilds, lowest total wins.
- **Canasta** — Classic partnership Canasta for up to four teams (eight players),
  with a full scoring breakdown.
- **Mexican Train** — one hand per double from the set's highest down to the
  blank; double-12 and double-15 sets, lowest pips win.
- **Phase 10** — ten phases in order; first to finish wins, lowest score breaks ties.
- **Hearts** — points checked against the 26 a hand always distributes; shooting
  the moon handled as a rule rather than arithmetic.
- **Spades** — partnership bids with bags carried between hands and the
  ten-bag penalty applied automatically. Nil and blind nil both ways.
- **Pinochle** — single-deck partnerships with a meld breakdown; a bidding team
  that falls short is set and loses the bid.
- **Rummy** — hands to 500.
- **Golf** — nine or eighteen holes, lowest wins.
- **Farkle** — banked points to 10,000.
- **Noisy Room** — a tool, not a game: everyone at the table hears everyone
  else through their own headphones. Scan a code to join; anyone can open a
  side room for a private word.

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
| `npm test`          | Scoring-rule unit tests             |
| `npm run debug`     | Dev server with `--inspect` on :9229 |

## Theming

Six light palettes: **Lavender** (default), **Meadow**, **Sky**, **Peach**,
**Mist**, and **Parchment** — soft tinted backgrounds with dark ink, differing
in hue rather than brightness. The picker sits on the hub and on every app
page; the choice is saved to `localStorage` and applies to the whole site.
Theme ids in storage predate the light redesign, so a stored choice keeps
working across it.

Tokens are named by *role* rather than by colour — `accent`, `ink`, `muted`,
`on-accent`, `well`, `card` — because the same class has to read correctly in
all six. Components never name a colour, so a theme is purely a block of CSS
variables in [`app/globals.css`](app/globals.css) plus an entry in
[`lib/themes.ts`](lib/themes.ts). Adding a seventh needs no component changes.

Two details worth knowing:

- **No flash.** A small blocking script in `<head>` sets `data-theme` before the
  body paints. Doing this in React would show a frame of the default palette
  first. It also means pages stay statically generated — reading the preference
  server-side would force every route to render per-request.
- **Contrast is checked, not assumed.** Every text/background pair in every
  theme meets WCAG AA (4.5:1), validated by computing the ratios against the
  composited panel surfaces whenever the palette changes.
- **Text size is adjustable.** Four sizes (100% to 137.5%) via the "A" buttons
  beside the theme picker, remembered per browser and applied before first
  paint by the same boot script as the theme. The whole layout is rem-based, so
  text and spacing scale together like browser zoom.

Changing the theme in one tab updates any other open tab, via the `storage`
event in [`lib/theme-client.ts`](lib/theme-client.ts).

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

## Canasta scoring

The rules live in [`apps/canasta/scoring.ts`](apps/canasta/scoring.ts), kept
apart from the UI because that is the part players argue about. Card values are
not modelled — the scorekeeper enters the melded total and the hand penalty, and
the module handles the bonuses (natural 500, mixed 300, going out 100 or 200
concealed), the red-three rule that flips sign for a partnership that never
melded, all four red threes counting double, and the meld minimum that climbs
15 → 50 → 90 → 120 as a partnership's score grows.

Because it is pure, it is tested directly rather than through the UI:

```bash
npm test
```

## Mexican Train

The set determines the length of the game: you play one hand per double,
counting down from the set's highest to double-blank, so a double-12 set is 13
hands and a double-15 set is 16. That derivation lives in
[`apps/mexican-train/sets.ts`](apps/mexican-train/sets.ts) and everything
follows from `highestDouble` — supporting double-18 later is one more entry in
`SETS` and no other change.

Scoring is one pip total per player per hand, lowest wins; an empty hand is
simply worth nothing, so going out needs no special case. The optional
double-blank house rule gives the 0-0 tile a fixed penalty in place of its zero.

## The shared scorekeeper

Golf, Rummy and Farkle differ only in wording, direction and how the game ends,
so they are configuration passed to
[`SimpleScorekeeper`](components/scorekeeper/SimpleScorekeeper.tsx) rather than
three near-identical components — each app file is about twenty lines. Games
needing extra per-player state (Hearts' moon, Phase 10's phases, the two
bidding games) have their own components and reuse the primitives in
[`components/ui.tsx`](components/ui.tsx) instead.

Scoring rules live in a `scoring.ts` beside each app that has any, kept apart
from the UI and tested directly:

```bash
npm test
```

## Noisy Room

The audio is not ours. Noisy Room hands people to
[VDO.Ninja's Comms app](https://docs.vdo.ninja/steves-helper-apps/comms), a
free browser intercom that is already audio-only, phone-first, and built around
a row of group buttons — which is exactly what a table wants. This site does the
part Comms cannot: it mints a room name, serves the page the QR code points at,
and keeps the list of side rooms so every phone's buttons match.

- **Room names** are two words and a number (`brave-otter-42`) so they can be
  read aloud to anyone who can't scan. Generation and validation live in
  [`apps/noisy-room/names.ts`](apps/noisy-room/names.ts); the Comms link is
  built in [`apps/noisy-room/links.ts`](apps/noisy-room/links.ts). Both are
  pure and tested.
- **The room page**, `/r/<room>`, renders for any well-formed name whether or
  not the database knows it. The database is ephemeral in production, and a
  code someone already scanned must survive a deploy; it just comes back with
  no side rooms.
- **Side rooms** are the one thing shared between visitors, so they have their
  own tables ([`lib/rooms.ts`](lib/rooms.ts)) rather than living in the
  per-user `app_state`. Anyone holding the link can add one; only its creator
  or the room's creator can remove it. Mutations are Server Actions in
  [`apps/noisy-room/actions.ts`](apps/noisy-room/actions.ts), and the page
  polls every fifteen seconds so a side room added on one phone shows up on the
  others.
- **Groups in Comms** are passed as `&groups=Table,Head,Center,Foot,…` — the
  four built-ins (`DEFAULT_GROUPS` in `names.ts`) then the side rooms. The plural
  form, which only defines the buttons. The singular `&group=` would be passed
  through to the inner VDO.Ninja frame and silently join it.
- **Audio knobs.** Every join link carries `&mediasettings` so each person gets
  VDO.Ninja's own settings gear (mic gain, auto-gain, noise suppression) rather
  than only a director. The room page's *Mic level* slider sets the starting
  `&audiogain`, remembered per phone and clamped to 50–200% so it can never
  reach the `0` that mutes a guest until a director unmutes them.
- `NEXT_PUBLIC_COMMS_URL` points at a different Comms host: a pinned version,
  the `comms.cam` alias, or a self-hosted copy.

## Rules

Every app carries its own rules, shown in a collapsible panel below the
scorekeeper. They live in `apps/<slug>/rules.ts` as plain data
([`lib/rules.ts`](lib/rules.ts) defines the shape), so each game presents the
same way and the panel needs no per-game markup.

[`RulesPanel`](components/RulesPanel.tsx) is built on `<details>` rather than
React state — it works before hydration and without JavaScript, which matters
for the thing you reach for mid-game.

Each game opens with **words you'll hear** — its vocabulary, defined before the
rules start leaning on it — and ends with **what this scorekeeper assumes**: the
places where the app commits to one reading of a rule that tables vary on.

That promise is enforced, not aspirational:
[`tests/rules-consistency.test.mts`](tests/rules-consistency.test.mts) pins the
numbers in the rules to the constants in the scoring modules, so a rule change
that is not also a code change fails `npm test`. A "How to play" link in each
app's nav jumps to the panel.

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

**2b.** Optionally add `apps/<slug>/rules.ts` and register it in
[`lib/rules.ts`](lib/rules.ts) to get a rules panel on the app page.

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
  canasta/                              manifest + component + scoring rules
  mexican-train/                        manifest + component + set definitions
  phase-10/ hearts/ spades/ pinochle/   manifest + component + scoring rules
  rummy/ golf/ farkle/                  manifest + SimpleScorekeeper config
components/scorekeeper/
  SimpleScorekeeper.tsx                 engine for one-number-per-round games
components/
  RulesPanel.tsx                        collapsible per-game rules
tests/
  canasta-scoring.test.mts              scoring-rule unit tests
  mexican-train-sets.test.mts           set/round derivation unit tests
components/
  ui.tsx          shared primitives -- every app draws from these
  ThemePicker.tsx the six-swatch theme selector
lib/
  identity.ts     cookie signing and verification (Edge-safe)
  themes.ts       theme catalogue + no-flash boot script
  theme-client.ts active theme as an external store
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
