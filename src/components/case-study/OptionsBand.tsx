import { caseStudyLabels as L } from "@/content/case-study-labels";
import type { Decision, DecisionOption } from "@/lib/case-study";
import styles from "./OptionsBand.module.css";

const status = (o: DecisionOption) => (o.status === "chosen" ? L.options.chosen : o.status === "reversed" ? L.options.reversed : L.options.notChosen);

/** One decision's options as a table: Option (with its status in words), For, Against, Cost. */
function OptionsTable({ decision, heading }: { decision: Decision; heading: string }) {
  const c = L.options.columns;
  return (
    <div className={styles.decision}>
      <h3 id={`${decision.id}-options`} className="t-h3">
        {heading}
      </h3>
      <table className={styles.table} role="table" aria-labelledby={`${decision.id}-options`}>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader" className="mono">
              {c.option}
            </th>
            <th scope="col" role="columnheader" className="mono">
              {c.pros}
            </th>
            <th scope="col" role="columnheader" className="mono">
              {c.cons}
            </th>
            <th scope="col" role="columnheader" className="mono">
              {c.cost}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {decision.options.map((o) => (
            <tr key={o.label} role="row" data-status={o.status}>
              <th scope="row" role="rowheader">
                <span className={styles.option}>
                  <span className={`${styles.status} mono`}>{status(o)}</span>
                  <span className={styles.label}>{o.label}</span>
                  {o.turnedBack && (
                    <span className={styles.turned}>
                      <span className="mono">{L.options.turnedBack(o.turnedBack.date)}</span> {o.turnedBack.text}
                    </span>
                  )}
                </span>
              </th>
              <td role="cell" data-label={c.pros}>
                <ul>
                  {o.pros.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </td>
              <td role="cell" data-label={c.cons}>
                <ul>
                  {o.cons.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </td>
              <td role="cell" data-label={c.cost}>
                {o.cost}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The options band, on the sheet: every decision's options in full, then the decision we
 * reversed (with when and why we turned back). Phones: each option a stacked block, never a table
 * that scrolls sideways. Nothing on the sheet moves.
 */
export function OptionsBand({ decisions, reversed }: { decisions: { decision: Decision; number: number }[]; reversed: Decision }) {
  return (
    <section className={styles.band} data-surface="sheet" data-band="" data-breaker="" aria-labelledby="options-heading">
      <div className={`${styles.inner} container`}>
        <h2 id="options-heading" className="t-h2">
          {L.options.heading}
        </h2>
        {decisions.map(({ decision, number }) => (
          <OptionsTable key={decision.id} decision={decision} heading={`${L.decision(number)} — ${decision.title}`} />
        ))}
        <OptionsTable decision={reversed} heading={`${L.reversedHeading} — ${reversed.title}`} />
        {reversed.after && <p className={styles.after}>{reversed.after}</p>}
      </div>
    </section>
  );
}
