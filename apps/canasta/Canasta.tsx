"use client";

import { useAppState } from "@/lib/useAppState";
import {
  Button,
  TextInput,
  IconButton,
  Standings,
  FooterControls,
} from "@/components/ui";
import {
  blankRound,
  minimumMeld,
  scoreTeam,
  totalsThrough,
  toPoints,
  DEFAULT_ROUNDS,
  DEFAULT_TARGET,
  type RoundData,
  type TeamEntry,
} from "./scoring";

/**
 * Classic Canasta scorekeeper for up to four partnerships.
 *
 * Canasta's arithmetic is the error-prone part -- bonuses, a red-three rule
 * that flips sign, and a meld minimum that climbs with your score -- so the app
 * does the sums and shows its working. The scorekeeper enters what happened,
 * not what it added up to.
 */

const MIN_TEAMS = 2;
const MAX_TEAMS = 4; // four partnerships, i.e. eight players
const PLAYERS_PER_TEAM = 2;

type Phase = "setup" | "play" | "done";
type EndKind = "target" | "rounds";

type GameState = {
  phase: Phase;
  /** Setup-screen fields, kept so a half-filled roster survives a reload. */
  draftTeams: string[][];
  draftEndKind: EndKind;
  draftTarget: string;
  draftRounds: string;
  /** Locked-in roster: one array of player names per partnership. */
  teams: string[][];
  endKind: EndKind;
  endValue: number;
  /** Rounds already recorded. */
  saved: RoundData[];
  /** The round currently being entered. */
  entry: RoundData;
  /** Index into `saved` when revising an earlier round; null when adding a new one. */
  editIndex: number | null;
};

const INITIAL: GameState = {
  phase: "setup",
  draftTeams: [
    ["", ""],
    ["", ""],
  ],
  draftEndKind: "target",
  draftTarget: String(DEFAULT_TARGET),
  draftRounds: String(DEFAULT_ROUNDS),
  teams: [],
  endKind: "target",
  endValue: DEFAULT_TARGET,
  saved: [],
  entry: blankRound(0),
  editIndex: null,
};

/** "Alice & Bob", or just "Alice" for a solo partnership in a two-handed game. */
function teamLabel(team: string[]): string {
  return team.map((n) => n.trim()).filter(Boolean).join(" & ");
}

export default function Canasta() {
  const { state, setState, status, reset } = useAppState<GameState>(
    "canasta",
    "current",
    INITIAL,
  );

  if (status === "loading") {
    return (
      <div className="panel p-6 text-center text-lilac" role="status">
        Dealing…
      </div>
    );
  }

  const { phase, teams, saved, entry, editIndex, endKind, endValue } = state;

  // ---- setup ------------------------------------------------------------
  const draftLabels = state.draftTeams.map(teamLabel);
  const canStart = draftLabels.filter(Boolean).length >= MIN_TEAMS;

  const startGame = () => {
    const roster = state.draftTeams
      .map((team) => team.map((n) => n.trim()).filter(Boolean))
      .filter((team) => team.length > 0);

    const kind = state.draftEndKind;
    const rawValue = kind === "target" ? state.draftTarget : state.draftRounds;
    const parsed = toPoints(rawValue);
    const value = parsed > 0 ? parsed : kind === "target" ? DEFAULT_TARGET : DEFAULT_ROUNDS;

    setState((previous) => ({
      ...previous,
      phase: "play",
      teams: roster,
      endKind: kind,
      endValue: value,
      saved: [],
      entry: blankRound(roster.length),
      editIndex: null,
    }));
  };

  // ---- scoring ----------------------------------------------------------
  const roundIndex = editIndex ?? saved.length;
  const totalsBefore = totalsThrough(saved, roundIndex, teams.length);
  const totals = totalsThrough(saved, saved.length, teams.length);

  const entryScores = teams.map((_, teamIndex) =>
    scoreTeam(
      entry.entries[teamIndex] ?? blankRound(teams.length).entries[0],
      entry.outTeam === teamIndex,
      entry.concealed,
    ),
  );

  const updateEntry = (teamIndex: number, patch: Partial<TeamEntry>) =>
    setState((previous) => ({
      ...previous,
      entry: {
        ...previous.entry,
        entries: previous.entry.entries.map((teamEntry, index) =>
          index === teamIndex ? { ...teamEntry, ...patch } : teamEntry,
        ),
      },
    }));

  /** Only one partnership can go out, so selecting one clears any other. */
  const setOutTeam = (teamIndex: number | null) =>
    setState((previous) => ({
      ...previous,
      entry: {
        ...previous.entry,
        outTeam: teamIndex,
        concealed: teamIndex === null ? false : previous.entry.concealed,
      },
    }));

  const saveRound = () => {
    setState((previous) => {
      const nextSaved =
        previous.editIndex !== null
          ? previous.saved.map((round, index) =>
              index === previous.editIndex ? previous.entry : round,
            )
          : [...previous.saved, previous.entry];

      // Recomputed from scratch rather than toggled, so revising an early round
      // can un-finish a game that had already ended -- and finish one that hadn't.
      const nextTotals = totalsThrough(nextSaved, nextSaved.length, previous.teams.length);
      const finished =
        previous.endKind === "target"
          ? Math.max(...nextTotals) >= previous.endValue
          : nextSaved.length >= previous.endValue;

      return {
        ...previous,
        saved: nextSaved,
        entry: blankRound(previous.teams.length),
        editIndex: null,
        phase: finished ? "done" : "play",
      };
    });
  };

  const editRound = (index: number) =>
    setState((previous) => ({
      ...previous,
      phase: "play",
      editIndex: index,
      entry: previous.saved[index],
    }));

  const cancelEdit = () =>
    setState((previous) => ({
      ...previous,
      editIndex: null,
      entry: blankRound(previous.teams.length),
      // Returning from an edit should restore the finished screen if the game
      // is in fact over.
      phase:
        previous.endKind === "target"
          ? Math.max(...totalsThrough(previous.saved, previous.saved.length, previous.teams.length)) >=
            previous.endValue
            ? "done"
            : "play"
          : previous.saved.length >= previous.endValue
            ? "done"
            : "play",
    }));

  const playAgain = () =>
    setState((previous) => ({
      ...previous,
      phase: "play",
      saved: [],
      entry: blankRound(previous.teams.length),
      editIndex: null,
    }));

  const standings = teams
    .map((team, teamIndex) => ({ name: teamLabel(team), total: totals[teamIndex] }))
    .sort((a, b) => b.total - a.total); // Canasta is highest-wins.
  const bestTotal = standings.length ? standings[0].total : 0;
  const winners = standings.filter((s) => s.total === bestTotal);

  return (
    <div>
      <header className="mb-5 text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-[0.18em]">Canasta</h1>
        <p className="mt-1 text-sm text-lilac">Partnerships · highest total wins</p>
      </header>

      {phase === "setup" && (
        <>
          <div className="panel mb-3 p-4">
            <h2 className="label-caps mb-3">
              Partnerships ({MIN_TEAMS}–{MAX_TEAMS})
            </h2>

            {state.draftTeams.map((team, teamIndex) => (
              <div key={teamIndex} className="mb-4 last:mb-1">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-display text-sm tracking-wide text-lilac">
                    Team {teamIndex + 1}
                  </span>
                  {state.draftTeams.length > MIN_TEAMS && (
                    <button
                      type="button"
                      className="text-sm text-lilac underline underline-offset-2 transition hover:text-gold"
                      onClick={() =>
                        setState((previous) => ({
                          ...previous,
                          draftTeams: previous.draftTeams.filter((_, i) => i !== teamIndex),
                        }))
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  {team.map((name, playerIndex) => (
                    <TextInput
                      key={playerIndex}
                      value={name}
                      placeholder={playerIndex === 0 ? "Player" : "Partner"}
                      aria-label={`Team ${teamIndex + 1}, player ${playerIndex + 1}`}
                      onChange={(event) =>
                        setState((previous) => ({
                          ...previous,
                          draftTeams: previous.draftTeams.map((t, i) =>
                            i === teamIndex
                              ? t.map((n, j) => (j === playerIndex ? event.target.value : n))
                              : t,
                          ),
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            ))}

            {state.draftTeams.length < MAX_TEAMS && (
              <Button
                variant="ghost"
                className="mt-1.5"
                onClick={() =>
                  setState((previous) => ({
                    ...previous,
                    draftTeams: [
                      ...previous.draftTeams,
                      Array.from({ length: PLAYERS_PER_TEAM }, () => ""),
                    ],
                  }))
                }
              >
                + Add partnership
              </Button>
            )}

            <p className="mt-2.5 text-center text-sm text-lilac">
              Leave a partner blank to play that seat solo.
            </p>
          </div>

          <div className="panel mb-3 p-4">
            <h2 className="label-caps mb-3">Game ends</h2>
            <div className="mb-3 flex gap-2">
              {(
                [
                  ["target", "At a target score"],
                  ["rounds", "After fixed rounds"],
                ] as [EndKind, string][]
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={state.draftEndKind === kind}
                  className={`flex-1 rounded-lg border px-2 py-2.5 font-display text-[13px] tracking-wide transition ${
                    state.draftEndKind === kind
                      ? "border-gold bg-gold font-bold text-plum"
                      : "border-lilac/35 text-lilac hover:border-gold/55 hover:text-gold"
                  }`}
                  onClick={() => setState((previous) => ({ ...previous, draftEndKind: kind }))}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-3 text-[15px]">
              <span className="flex-1 text-lilac">
                {state.draftEndKind === "target" ? "Target score" : "Number of rounds"}
              </span>
              <TextInput
                type="number"
                inputMode="numeric"
                min="1"
                className="max-w-28 flex-none text-center font-display"
                value={state.draftEndKind === "target" ? state.draftTarget : state.draftRounds}
                onChange={(event) =>
                  setState((previous) =>
                    previous.draftEndKind === "target"
                      ? { ...previous, draftTarget: event.target.value }
                      : { ...previous, draftRounds: event.target.value },
                  )
                }
              />
            </label>
          </div>

          <Button disabled={!canStart} onClick={startGame}>
            Deal the first hand
          </Button>
          {!canStart && (
            <p className="mt-2.5 text-center text-sm text-lilac">
              Name at least two partnerships to start.
            </p>
          )}
        </>
      )}

      {(phase === "play" || (phase === "done" && editIndex !== null)) && (
        <>
          <div className="panel mb-3 flex items-baseline justify-between gap-3 p-4">
            <div>
              <div className="font-display text-xl font-bold tracking-wide">
                {editIndex !== null ? `Editing hand ${editIndex + 1}` : `Hand ${roundIndex + 1}`}
              </div>
              <div className="mt-0.5 text-sm text-lilac">
                {endKind === "target"
                  ? `Playing to ${endValue}`
                  : `${saved.length} of ${endValue} hands played`}
              </div>
            </div>
            {editIndex !== null && (
              <button
                type="button"
                className="text-sm text-lilac underline underline-offset-2 transition hover:text-gold"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>

          {teams.map((team, teamIndex) => (
            <TeamCard
              key={teamIndex}
              label={teamLabel(team)}
              entry={entry.entries[teamIndex]}
              score={entryScores[teamIndex]}
              minimumMeld={minimumMeld(totalsBefore[teamIndex])}
              runningTotal={totalsBefore[teamIndex]}
              wentOut={entry.outTeam === teamIndex}
              concealed={entry.concealed}
              onChange={(patch) => updateEntry(teamIndex, patch)}
              onToggleOut={() => setOutTeam(entry.outTeam === teamIndex ? null : teamIndex)}
              onToggleConcealed={() =>
                setState((previous) => ({
                  ...previous,
                  entry: { ...previous.entry, concealed: !previous.entry.concealed },
                }))
              }
            />
          ))}

          <Button onClick={saveRound}>
            {editIndex !== null ? "Update hand" : "Save hand"}
          </Button>

          {saved.length > 0 && (
            <>
              <div className="panel mb-3 mt-4 p-4">
                <h2 className="label-caps mb-2">Standings</h2>
                <Standings rows={standings} bestTotal={bestTotal} markLeader />
              </div>

              <div className="panel mb-3 p-4">
                <h2 className="label-caps mb-2.5">Hands — tap to edit</h2>
                <HandChips
                  count={saved.length}
                  editing={editIndex}
                  onEdit={editRound}
                />
              </div>
            </>
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
            <p className="mb-5 mt-0.5 text-[15px] text-lilac">
              {winners.length > 1 ? "tie the crown" : "takes the crown"} with {bestTotal} points
              {" · "}
              {saved.length} {saved.length === 1 ? "hand" : "hands"}
            </p>
            <div className="text-left">
              <Standings rows={standings} bestTotal={bestTotal} />
            </div>
          </div>

          <Button className="mt-3" onClick={playAgain}>
            Play again — same partnerships
          </Button>
          <Button variant="ghost" className="mt-2" onClick={reset}>
            New partnerships
          </Button>

          <p className="mt-3 text-center text-sm text-lilac">
            Need to fix a score? Reopen any hand below.
          </p>
          <div className="panel mt-3 p-4">
            <HandChips count={saved.length} editing={null} onEdit={editRound} />
          </div>

          <FooterControls status={status} />
        </>
      )}
    </div>
  );
}

/** One partnership's entry for the current hand, with its running arithmetic. */
function TeamCard({
  label,
  entry,
  score,
  minimumMeld: meldMinimum,
  runningTotal,
  wentOut,
  concealed,
  onChange,
  onToggleOut,
  onToggleConcealed,
}: {
  label: string;
  entry: TeamEntry;
  score: { lines: { label: string; detail?: string; points: number }[]; total: number };
  minimumMeld: number;
  runningTotal: number;
  wentOut: boolean;
  concealed: boolean;
  onChange: (patch: Partial<TeamEntry>) => void;
  onToggleOut: () => void;
  onToggleConcealed: () => void;
}) {
  return (
    <div className="panel mb-3 p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-lilac/15 pb-2.5">
        <span className="font-display text-lg font-bold tracking-wide">{label}</span>
        <span className="text-right text-[13px] leading-tight text-lilac">
          {runningTotal} pts
          <br />
          <span className="text-lilac/70">meld {meldMinimum}</span>
        </span>
      </div>

      <Counter
        label="Natural canastas"
        value={entry.naturalCanastas}
        onChange={(naturalCanastas) => onChange({ naturalCanastas })}
      />
      <Counter
        label="Mixed canastas"
        value={entry.mixedCanastas}
        onChange={(mixedCanastas) => onChange({ mixedCanastas })}
      />
      <Counter
        label="Red threes"
        value={entry.redThrees}
        max={4}
        onChange={(redThrees) => onChange({ redThrees })}
      />

      <NumberRow
        label="Melded card points"
        value={entry.meldedPoints}
        onChange={(meldedPoints) => onChange({ meldedPoints })}
      />
      <NumberRow
        label="Cards left in hand"
        value={entry.cardsInHand}
        onChange={(cardsInHand) => onChange({ cardsInHand })}
      />

      <div className="flex flex-wrap items-center gap-2 py-2">
        <button
          type="button"
          aria-pressed={wentOut}
          className={`rounded-full border px-3 py-1.5 font-display text-[13px] transition ${
            wentOut
              ? "border-gold bg-gold font-bold text-plum"
              : "border-lilac/35 text-lilac hover:border-gold/55 hover:text-gold"
          }`}
          onClick={onToggleOut}
        >
          Went out
        </button>
        {wentOut && (
          <button
            type="button"
            aria-pressed={concealed}
            className={`rounded-full border px-3 py-1.5 font-display text-[13px] transition ${
              concealed
                ? "border-gold bg-gold font-bold text-plum"
                : "border-lilac/35 text-lilac hover:border-gold/55 hover:text-gold"
            }`}
            onClick={onToggleConcealed}
          >
            Concealed
          </button>
        )}
      </div>

      {/* The working, so a disputed total can be checked without re-entry. */}
      <div className="mt-2 border-t border-lilac/15 pt-2.5">
        {score.lines.length === 0 ? (
          <p className="text-sm text-lilac/70">Nothing recorded for this hand yet.</p>
        ) : (
          <ul className="mb-1.5">
            {score.lines.map((line, index) => (
              <li key={index} className="flex items-baseline gap-2 py-0.5 text-sm">
                <span className="flex-1 text-lilac">
                  {line.label}
                  {line.detail && <span className="text-lilac/60"> · {line.detail}</span>}
                </span>
                <span
                  className={`font-display tabular-nums ${
                    line.points < 0 ? "text-lilac" : "text-cream"
                  }`}
                >
                  {line.points > 0 ? "+" : ""}
                  {line.points}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-baseline gap-2 border-t border-lilac/15 pt-2">
          <span className="label-caps flex-1">Hand total</span>
          <span className="font-display text-xl font-bold tabular-nums text-gold">
            {score.total}
          </span>
        </div>
      </div>
    </div>
  );
}

function Counter({
  label,
  value,
  max = 20,
  onChange,
}: {
  label: string;
  value: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-lilac/15 py-2">
      <span className="flex-1 text-[15px]">{label}</span>
      <IconButton
        className="!w-9 py-1.5"
        disabled={value <= 0}
        aria-label={`One fewer ${label.toLowerCase()}`}
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        −
      </IconButton>
      <span
        className="w-7 text-center font-display text-lg tabular-nums"
        aria-live="polite"
        aria-label={`${label}: ${value}`}
      >
        {value}
      </span>
      <IconButton
        className="!w-9 py-1.5"
        disabled={value >= max}
        aria-label={`One more ${label.toLowerCase()}`}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </IconButton>
    </div>
  );
}

function NumberRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 border-b border-lilac/15 py-2">
      <span className="flex-1 text-[15px]">{label}</span>
      <TextInput
        type="number"
        inputMode="numeric"
        min="0"
        placeholder="0"
        className="max-w-24 flex-none py-2 text-center font-display"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
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
          className={`rounded-full border px-3 py-1.5 font-display text-[13px] transition ${
            index === editing
              ? "border-gold bg-gold font-bold text-plum"
              : "border-gold/55 text-gold hover:bg-gold/10"
          }`}
          onClick={() => onEdit(index)}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}
