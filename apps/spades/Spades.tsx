"use client";

import { useAppState } from "@/lib/useAppState";
import { Button, TextInput, FooterControls } from "@/components/ui";
import {
  blankHand,
  scoreTeamHand,
  runningTotals,
  trickTotal,
  isFinished,
  toCount,
  TRICKS_PER_HAND,
  DEFAULT_TARGET,
  BAG_LIMIT,
  type Hand,
  type TeamHand,
  type NilKind,
} from "./scoring";

/**
 * Spades scorekeeper, partnership rules.
 *
 * Two teams of two. The app carries the bag count between hands and applies
 * the penalty automatically, which is the part tables reliably get wrong.
 */

type State = {
  phase: "setup" | "play" | "done";
  /** Four names: [team0 player0, team0 player1, team1 player0, team1 player1]. */
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

export default function Spades() {
  const { state, setState, status, reset } = useAppState<State>("spades", "current", INITIAL);

  if (status === "loading") {
    return (
      <div className="panel p-6 text-center text-muted" role="status">
        Dealing…
      </div>
    );
  }

  const { phase, teams, hands, entry, editIndex, target } = state;

  const named = state.draftNames.map((n) => n.trim());
  const canStart = named.every(Boolean);

  const startGame = () =>
    setState((previous) => {
      const clean = previous.draftNames.map((n) => n.trim());
      const typed = toCount(previous.draftTarget);
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
  const progress = runningTotals(hands, 2);
  const tricks = trickTotal(entry);
  const tricksBalanced = tricks === TRICKS_PER_HAND;

  const updateTeam = (teamIndex: number, patch: Partial<TeamHand>) =>
    setState((previous) => ({
      ...previous,
      entry: {
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
    .map((team, index) => ({ name: teamLabel(team), ...progress[index] }))
    .sort((a, b) => b.score - a.score); // Highest wins.
  const bestScore = ranked.length ? ranked[0].score : 0;
  const winners = ranked.filter((t) => t.score === bestScore);

  return (
    <div>
      <header className="mb-5 text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-[0.18em]">Spades</h1>
        <p className="mt-1 text-sm text-muted">Partnerships · highest total wins</p>
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
          <div className="panel mb-3 flex items-baseline justify-between gap-3 p-4">
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

          {teams.map((team, teamIndex) => (
            <TeamCard
              key={teamIndex}
              team={team}
              hand={entry.teams[teamIndex]}
              progress={progress[teamIndex]}
              onChange={(patch) => updateTeam(teamIndex, patch)}
            />
          ))}

          {/* Both teams' tricks must come to thirteen. */}
          <div className="panel mb-3 flex items-baseline justify-between gap-2 p-4">
            <span className="label-caps">Tricks accounted for</span>
            <span
              className={`font-display text-lg font-bold tabular-nums ${
                tricksBalanced ? "text-accent" : "text-muted"
              }`}
            >
              {tricks} / {TRICKS_PER_HAND}
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
            <p className="mb-5 mt-0.5 text-[15px] text-muted">
              {winners.length > 1 ? "tie" : "wins"} with {bestScore} points
            </p>
            <ol className="text-left">
              {ranked.map((team, index) => (
                <li
                  key={team.name}
                  className={`flex items-baseline gap-2.5 py-1.5 text-[17px] ${
                    team.score === bestScore ? "text-accent" : ""
                  }`}
                >
                  <span className="w-[18px] shrink-0 text-[13px] text-muted">{index + 1}</span>
                  <span className="flex-1">{team.name}</span>
                  <span className="text-[13px] text-muted">{team.bags} bags</span>
                  <span className="font-display text-lg font-bold tabular-nums">{team.score}</span>
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
  team,
  hand,
  progress,
  onChange,
}: {
  team: string[];
  hand: TeamHand;
  progress: { score: number; bags: number };
  onChange: (patch: Partial<TeamHand>) => void;
}) {
  const { lines, points } = scoreTeamHand(hand);
  const bagsToPenalty = BAG_LIMIT - progress.bags;

  return (
    <div className="panel mb-3 p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-muted/15 pb-2.5">
        <span className="font-display text-lg font-bold tracking-wide">{teamLabel(team)}</span>
        <span className="text-right text-[13px] leading-tight text-muted">
          {progress.score} pts
          <br />
          <span className={bagsToPenalty <= 2 ? "text-accent" : "text-muted/70"}>
            {progress.bags} bags
          </span>
        </span>
      </div>

      <div className="mb-2 flex gap-2">
        <label className="flex flex-1 items-center gap-2">
          <span className="flex-1 text-[15px]">Bid</span>
          <TextInput
            type="number"
            inputMode="numeric"
            min="0"
            max="13"
            placeholder="0"
            className="max-w-20 flex-none py-2 text-center font-display text-lg"
            value={hand.bid}
            onChange={(event) => onChange({ bid: event.target.value })}
          />
        </label>
        <label className="flex flex-1 items-center gap-2">
          <span className="flex-1 text-[15px]">Took</span>
          <TextInput
            type="number"
            inputMode="numeric"
            min="0"
            max="13"
            placeholder="0"
            className="max-w-20 flex-none py-2 text-center font-display text-lg"
            value={hand.tricks}
            onChange={(event) => onChange({ tricks: event.target.value })}
          />
        </label>
      </div>

      {/* Nil is per player, so each partner gets their own control. */}
      {team.map((player, seat) => {
        const kind = hand.nils[seat] ?? "none";
        const cycle: NilKind[] = ["none", "nil", "blind"];
        const next = cycle[(cycle.indexOf(kind) + 1) % cycle.length];
        return (
          <div key={seat} className="flex items-center gap-2 border-t border-muted/15 py-2">
            <span className="flex-1 text-[15px] text-muted">{player}</span>
            <button
              type="button"
              onClick={() => onChange({ nils: hand.nils.map((n, i) => (i === seat ? next : n)) })}
              className={`rounded-full border px-3 py-1 font-display text-[13px] transition ${
                kind === "none"
                  ? "border-muted/35 text-muted hover:border-accent/55 hover:text-accent"
                  : "border-accent bg-accent font-bold text-on-accent"
              }`}
            >
              {kind === "none" ? "no nil" : kind === "nil" ? "nil" : "blind nil"}
            </button>
            {kind !== "none" && (
              <button
                type="button"
                aria-pressed={hand.nilMade[seat] ?? false}
                onClick={() =>
                  onChange({ nilMade: hand.nilMade.map((m, i) => (i === seat ? !m : m)) })
                }
                className={`rounded-full border px-3 py-1 font-display text-[13px] transition ${
                  hand.nilMade[seat]
                    ? "border-accent bg-accent font-bold text-on-accent"
                    : "border-muted/35 text-muted hover:border-accent/55"
                }`}
              >
                {hand.nilMade[seat] ? "made" : "failed"}
              </button>
            )}
          </div>
        );
      })}

      <div className="mt-2 border-t border-muted/15 pt-2.5">
        {lines.length === 0 ? (
          <p className="text-sm text-muted/70">Nothing recorded for this hand yet.</p>
        ) : (
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
        )}
        <div className="flex items-baseline gap-2 border-t border-muted/15 pt-2">
          <span className="label-caps flex-1">Hand total</span>
          <span className="font-display text-xl font-bold tabular-nums text-accent">{points}</span>
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
          className={`min-w-9 rounded-full border px-2.5 py-1.5 font-display text-[13px] transition ${
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
