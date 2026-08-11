import type { Rules, RulesBlock } from "@/lib/rules";

/**
 * The rules for a game, collapsed by default.
 *
 * Built on <details> rather than React state: it works before hydration and
 * without JavaScript, which matters because this is the thing you reach for
 * mid-game when you want an answer immediately.
 */
export function RulesPanel({ rules, title }: { rules: Rules; title: string }) {
  return (
    // scroll-mt keeps the panel clear of the viewport edge when jumped to via
    // the #rules link in the page nav.
    <details id="rules" className="panel group mt-6 scroll-mt-4 overflow-hidden">
      {/* list-none hides the marker in most browsers; Safari needs the
          ::-webkit-details-marker override or it draws its own as well. */}
      <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-display text-xs uppercase tracking-[0.16em] text-accent transition hover:bg-accent/5 [&::-webkit-details-marker]:hidden">
        <span
          className="inline-block transition-transform group-open:rotate-90 motion-reduce:transition-none"
          aria-hidden="true"
        >
          ▸
        </span>
        How to play {title}
      </summary>

      <div className="border-t border-muted/15 px-4 pb-5 pt-4">
        <dl className="mb-5 grid gap-2 text-[15px] sm:grid-cols-[auto_1fr] sm:gap-x-4">
          <dt className="font-display text-[13px] uppercase tracking-wide text-muted">Object</dt>
          <dd className="mb-2 sm:mb-0">{rules.objective}</dd>
          <dt className="font-display text-[13px] uppercase tracking-wide text-muted">Players</dt>
          <dd className="mb-2 sm:mb-0">{rules.players}</dd>
          <dt className="font-display text-[13px] uppercase tracking-wide text-muted">You need</dt>
          <dd>{rules.equipment}</dd>
        </dl>

        {/* Vocabulary first: the sections below use these words freely, and a
            first-time player should meet them before the rules lean on them. */}
        {rules.terms && rules.terms.length > 0 && (
          <section className="mb-5">
            <h3 className="label-caps mb-2">Words you&rsquo;ll hear</h3>
            <dl className="space-y-1.5 text-[15px] leading-relaxed">
              {rules.terms.map((entry) => (
                <div key={entry.term}>
                  <dt className="inline font-display font-bold text-accent">{entry.term}</dt>
                  <dd className="inline"> — {entry.meaning}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {rules.sections.map((section) => (
          <section key={section.heading} className="mb-5 last:mb-0">
            <h3 className="label-caps mb-2">{section.heading}</h3>
            {section.blocks.map((block, index) => (
              <Block key={index} block={block} />
            ))}
          </section>
        ))}

        {rules.appNotes && rules.appNotes.length > 0 && (
          <section className="mt-5 border-t border-muted/15 pt-4">
            <h3 className="label-caps mb-2">What this scorekeeper assumes</h3>
            <ul className="ml-4 list-disc space-y-1.5 text-[15px] text-muted marker:text-accent/60">
              {rules.appNotes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </details>
  );
}

function Block({ block }: { block: RulesBlock }) {
  switch (block.kind) {
    case "text":
      return <p className="mb-2.5 text-[15px] leading-relaxed last:mb-0">{block.text}</p>;

    case "list":
      return (
        <ul className="mb-2.5 ml-4 list-disc space-y-1.5 text-[15px] leading-relaxed last:mb-0 marker:text-accent/60">
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <ol className="mb-2.5 ml-4 list-decimal space-y-1.5 text-[15px] leading-relaxed last:mb-0 marker:font-display marker:text-accent/60">
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ol>
      );

    case "table":
      return (
        // Wide tables scroll inside their own box rather than pushing the page
        // sideways on a phone.
        <div className="mb-2.5 overflow-x-auto last:mb-0">
          <table className="w-full min-w-[18rem] border-collapse text-[15px]">
            {block.table.caption && (
              <caption className="mb-1.5 text-left text-[13px] text-muted">
                {block.table.caption}
              </caption>
            )}
            <thead>
              <tr>
                {block.table.columns.map((column, index) => (
                  <th
                    key={column}
                    scope="col"
                    className={`border-b border-muted/25 py-1.5 pr-3 font-display text-[13px] uppercase tracking-wide text-muted ${
                      index === 0 ? "text-left" : "text-right"
                    }`}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.table.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`border-b border-muted/10 py-1.5 pr-3 ${
                        cellIndex === 0
                          ? "text-left"
                          : "text-right font-display tabular-nums text-accent"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}
