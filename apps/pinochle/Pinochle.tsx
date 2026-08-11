"use client";

import { useAppState } from "@/lib/useAppState";
import { Button, TextInput, IconButton, FooterControls } from "@/components/ui";
import {
  MELDS,
  blankHand,
  blankTeamHand,
  meldTotal,
  scoreTeamHand,
  totals as computeTotals,
  trickTotal,
  isFinished,
  toPoints,
  TRICK_POINTS_AVAILABLE,
  DEFAULT_TARGET,
  type Hand,
  type TeamHand,
  type MeldKey,
} from "./scoring";

/**
 * Pinochle scorekeeper: partnership, single deck.
 *
 * Meld is entered as a breakdown rather than a total, because that is the part
 * tables argue about and the one worth showing the working for.
 */

type State = {
  phase: "setup" | "play" | "done";
  draftNames: string[];
  draftTarget: string;
  teams: string[][];
  target: number;
  hands: Hand[];
  editIndex: number | null;
  entry: Hand;
};

const INITIAL: State = {
  phase: "setup",
  draftNames: ["", "", "", ""],
  draftTarget: String(DEFAULT_TARGET),
  teams: [],
  target: DEFAULT_TARGET,
  hands: [],
  editIndex: null,
  entry: blankHand(),
};

const teamLabel = (team: string[]) => team.filter(Boolean).join(" & ");

export default function Pinochle() {
  const { state, setState, status, reset } = useAppState<State>("pinochle", "current", INITIAL);

  if (status === "loading") {
    return (
      <div className="panel p-6 text-center text-muted" role="status">
        Dealing…
      </div>
    );
  }

  const { phase, teams, hands, entry, editIndex, target } = state;

  const canStart = state.draftNames.every((n) => n.trim());

  const startGame = () =>
    setState((previous) => {
      const clean = previous.draftNames.map((n) => n.trim());
      const typed = toPoints(previous.draftTarget);
      return {
        ...previous,
        phase: "play",
        teams: [
          [clean[0], clean[1]],
          [clean[2], clean[3]],
        ],
        target: typed > 0 ? typed : DEFAULT_TARGET,
        hands: [],
        editIndex: null,
        entry: blankHand(),
      };
    });

  const handIndex = editIndex ?? hands.length;
  const totals = computeTotals(hands, 2);
  const bid = toPoints(entry.bid);
  const tricks = trickTotal(entry);
  const tricksBalanced = tricks === TRICK_POINTS_AVAILABLE;

  const updateTeam = (teamIndex: number, patch: Partial<TeamHand>) =>
    setState((previous) => ({
      ...previous,
      entry: {
        ...previous.entry,
        teams: previous.entry.teams.map((team, i) =>
          i === teamIndex ? { ...team, ...patch } : team,
        ),
      },
    }));

  const saveHand = () =>
    setState((previous) => {
      const next =
        previous.editIndex !== null
          ? previous.hands.map((hand, i) => (i === previous.editIndex ? previous.entry : hand))
          : [...previous.hands, previous.entry];
      return {
        ...previous,
        hands: next,
        editIndex: null,
        entry: blankHand(),
        phase: isFinished(next, 2, previous.target) ? "done" : "play",
      };
    });

  const editHand = (index: number) =>
    setState((previous) => ({
      ...previous,
      phase: "play",
      editIndex: index,
      entry: previous.hands[index],
    }));

  const cancelEdit = () =>
    setState((previous) => ({
      ...previous,
      editIndex: null,
      entry: blankHand(),
      phase: isFinished(previous.hands, 2, previous.target) ? "done" : "play",
    }));

  const playAgain = () =>
    setState((previous) => ({
      ...previous,
      phase: "play",
      hands: [],
      editIndex: null,
      entry: blankHand(),
    }));

  const ranked = teams
    .map((team, index) => ({ name: teamLabel(team), total: totals[index] }))
    .sort((a, b) => b.total - a.total);
  const bestTotal = ranked.length ? ranked[0].total : 0;
  const winners = ranked.filter((t) => t.total === bestTotal);

  return (
    <div>
      <header className="mb-5 text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-[0.18em]">Pinochle</h1>
        <p className="mt-1 text-sm text-muted">Partnerships · single deck · highest wins</p>
      </header>

      {phase === "setup" && (
        <>
          <div className="panel mb-3 p-4">
            <h2 className="label-caps mb-3">Partnerships</h2>
            {[0, 1].map((teamIndex) => (
              <div key={teamIndex} className="mb-4 last:mb-1">
                <div className="mb-1.5 font-display text-sm tracking-wide text-muted">
                  Team {teamIndex + 1}
                </div>
                <div className="flex gap-2">
                  {[0, 1].map((seat) => {
                    const nameIndex = teamIndex * 2 + seat;
                    return (
                      <TextInput
                        key={seat}
                        value={state.draftNames[nameIndex]}
                        placeholder={seat === 0 ? "Player" : "Partner"}
                        aria-label={`Team ${teamIndex + 1} player ${seat + 1}`}
                        onChange={(event) =>
                          setState((previous) => ({
                            ...previous,
                            draftNames: previous.draftNames.map((n, i) =>
                              i === nameIndex ? event.target.value : n,
                            ),
                          }))
                        }
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="panel mb-3 p-4">
            <h2 className="label-caps mb-3">Play to</h2>
            <TextInput
              type="number"
              inputMode="numeric"
              min="1"
              aria-label="Target score"
              className="text-center font-display text-lg"
              value={state.draftTarget}
              onChange={(event) =>
                setState((previous) => ({ ...previous, draftTarget: event.target.value }))
              }
            />
          </div>

          <Button disabled={!canStart} onClick={startGame}>
            Deal the first hand
          </Button>
          {!canStart && (
            <p className="mt-2.5 text-center text-sm text-muted">
              Name all four players to start.
            </p>
          )}
        </>
      )}

      {(phase === "play" || (phase === "done" && editIndex !== null)) && (
        <>
          <div className="panel mb-3 p-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <div>
                <div className="font-display text-xl font-bold tracking-wide">
                  {editIndex !== null ? `Editing hand ${editIndex + 1}` : `Hand ${handIndex + 1}`}
                </div>
                <div className="mt-0.5 text-sm text-muted">Playing to {target}</div>
              </div>
              {editIndex !== null && (
                <button
                  type="button"
                  className="text-sm text-muted underline underline-offset-2 transition hover:text-accent"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="mb-2 label-caps">The bid</div>
            <div className="flex gap-2">
              {teams.map((team, teamIndex) => (
                <button
                  key={teamIndex}
                  type="button"
                  aria-pressed={entry.biddingTeam === teamIndex}
                  onClick={() =>
                    setState((previous) => ({
                      ...previous,
                      entry: {
                        ...previous.entry,
                        biddingTeam:
                          previous.entry.biddingTeam === teamIndex ? null : teamIndex,
                      },
                    }))
                  }
                  className={`flex-1 rounded-lg border px-2 py-2 font-display text-[0.8125rem] transition ${
                    entry.biddingTeam === teamIndex
                      ? "border-accent bg-accent font-bold text-on-accent"
                      : "border-muted/35 text-muted hover:border-accent/55 hover:text-accent"
                  }`}
                >
                  {teamLabel(team)}
                </button>
              ))}
              <TextInput
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="bid"
                aria-label="Bid amount"
                className="max-w-24 flex-none py-2 text-center font-display text-lg"
                value={entry.bid}
                onChange={(event) =>
                  setState((previous) => ({
                    ...previous,
                    entry: { ...previous.entry, bid: event.target.value },
                  }))
                }
              />
            </div>
            {entry.biddingTeam === null && (
              <p className="mt-2 text-center text-[0.8125rem] text-muted">
                Pick the team that took the bid — they lose it outright if they fall short.
              </p>
            )}
          </div>

          {teams.map((team, teamIndex) => (
            <TeamCard
              key={teamIndex}
              label={teamLabel(team)}
              hand={entry.teams[teamIndex] ?? blankTeamHand()}
              isBidder={entry.biddingTeam === teamIndex}
              bid={bid}
              runningTotal={totals[teamIndex]}
              onChange={(patch) => updateTeam(teamIndex, patch)}
            />
          ))}

          <div className="panel mb-3 flex items-baseline justify-between gap-2 p-4">
            <span className="label-caps">Trick points</span>
            <span
              className={`font-display text-lg font-bold tabular-nums ${
                tricksBalanced ? "text-accent" : "text-muted"
              }`}
            >
              {tricks} / {TRICK_POINTS_AVAILABLE}
            </span>
          </div>

          <Button onClick={saveHand}>
            {editIndex !== null ? "Update hand" : "Save hand"}
          </Button>

          {hands.length > 0 && (
            <div className="panel mb-3 mt-4 p-4">
              <h2 className="label-caps mb-2.5">Hands — tap to edit</h2>
              <HandChips count={hands.length} editing={editIndex} onEdit={editHand} />
            </div>
          )}

          <FooterControls status={status} onReset={reset} />
        </>
      )}

      {phase === "done" && editIndex === null && (
        <>
          <div className="panel p-4 pt-6 text-center">
            <div className="text-5xl" aria-hidden="true">
              👑
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-wide">
              {winners.map((w) => w.name).join(" & ")}
            </h2>
            <p className="mb-5 mt-0.5 text-[0.9375rem] text-muted">
              {winners.length > 1 ? "tie" : "wins"} with {bestTotal} points
            </p>
            <ol className="text-left">
              {ranked.map((team, index) => (
                <li
                  key={team.name}
                  className={`flex items-baseline gap-2.5 py-1.5 text-[1.0625rem] ${
                    team.total === bestTotal ? "text-accent" : ""
                  }`}
                >
                  <span className="w-[18px] shrink-0 text-[0.8125rem] text-muted">{index + 1}</span>
                  <span className="flex-1">{team.name}</span>
                  <span className="font-display text-lg font-bold tabular-nums">{team.total}</span>
                </li>
              ))}
            </ol>
          </div>

          <Button className="mt-3" onClick={playAgain}>
            Play again — same partnerships
          </Button>
          <Button variant="ghost" className="mt-2" onClick={reset}>
            New players
          </Button>

          <div className="panel mt-3 p-4">
            <h2 className="label-caps mb-2.5">Hands — tap to edit</h2>
            <HandChips count={hands.length} editing={null} onEdit={editHand} />
          </div>

          <FooterControls status={status} />
        </>
      )}
    </div>
  );
}

function TeamCard({
  label,
  hand,
  isBidder,
  bid,
  runningTotal,
  onChange,
}: {
  label: string;
  hand: TeamHand;
  isBidder: boolean;
  bid: number;
  runningTotal: number;
  onChange: (patch: Partial<TeamHand>) => void;
}) {
  const meld = meldTotal(hand.melds);
  const { lines, total, set } = scoreTeamHand(hand, isBidder, bid);

  const setMeld = (key: MeldKey, value: number) =>
    onChange({ melds: { ...hand.melds, [key]: Math.max(0, value) } });

  return (
    <div className="panel mb-3 p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-muted/15 pb-2.5">
        <span className="font-display text-lg font-bold tracking-wide">
          {label}
          {isBidder && <span className="ml-2 text-[0.8125rem] font-normal text-accent">bid {bid}</span>}
        </span>
        <span className="text-[0.8125rem] text-muted">{runningTotal} pts</span>
      </div>

      {MELDS.map((item) => {
        const count = hand.melds[item.key] ?? 0;
        return (
          <div key={item.key} className="flex items-center gap-2 border-b border-muted/15 py-1.5">
            <span className="flex-1 text-[0.9375rem]">
              {item.label}
              {"detail" in item && item.detail && (
                <span className="ml-1.5 text-[0.8125rem] text-muted">{item.detail}</span>
              )}
            </span>
            <span className="w-9 text-right text-[0.8125rem] text-muted">{item.value}</span>
            <IconButton
              className="!w-8 py-1"
              disabled={count <= 0}
              aria-label={`One fewer ${item.label}`}
              onClick={() => setMeld(item.key, count - 1)}
            >
              −
            </IconButton>
            <span className="w-6 text-center font-display text-base tabular-nums">{count}</span>
            <IconButton
              className="!w-8 py-1"
              aria-label={`One more ${item.label}`}
              onClick={() => setMeld(item.key, count + 1)}
            >
              +
            </IconButton>
          </div>
        );
      })}

      <div className="flex items-baseline gap-2 border-b border-muted/15 py-2">
        <span className="label-caps flex-1">Meld</span>
        <span className="font-display text-lg font-bold tabular-nums">{meld}</span>
      </div>

      <label className="flex items-center gap-2 py-2">
        <span className="flex-1 text-[0.9375rem]">Trick points</span>
        <TextInput
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="0"
          className="max-w-24 flex-none py-2 text-center font-display text-lg"
          value={hand.tricks}
          onChange={(event) => onChange({ tricks: event.target.value })}
        />
      </label>

      <div className="mt-1 border-t border-muted/15 pt-2.5">
        <ul className="mb-1.5">
          {lines.map((line, index) => (
            <li key={index} className="flex items-baseline gap-2 py-0.5 text-sm">
              <span className="flex-1 text-muted">
                {line.label}
                {line.detail && <span className="text-muted/60"> · {line.detail}</span>}
              </span>
              <span className="font-display tabular-nums">
                {line.points > 0 ? "+" : ""}
                {line.points}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline gap-2 border-t border-muted/15 pt-2">
          <span className="label-caps flex-1">{set ? "Set" : "Hand total"}</span>
          <span className="font-display text-xl font-bold tabular-nums text-accent">{total}</span>
        </div>
      </div>
    </div>
  );
}

function HandChips({
  count,
  editing,
  onEdit,
}: {
  count: number;
  editing: number | null;
  onEdit: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-current={index === editing ? "step" : undefined}
          aria-label={`Edit hand ${index + 1}`}
          onClick={() => onEdit(index)}
          className={`min-w-9 rounded-full border px-2.5 py-1.5 font-display text-[0.8125rem] transition ${
            index === editing
              ? "border-accent bg-accent font-bold text-on-accent"
              : "border-accent/55 text-accent hover:bg-accent/10"
          }`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}
