import type { CSSProperties } from "react";
import { caseStudyLabels as L } from "@/content/case-study-labels";
import type { CaseStudy, Decision } from "@/lib/case-study";
import type { DecisionStep } from "@/lib/survey-layout";
import { Blocks, type Numbers } from "./Blocks";
import { Figure } from "./Figure";
import { PinnedSwap } from "./PinnedSwap";
import styles from "./PinnedDecision.module.css";

/** A decision without a figure of its own: its options set as type (the table holds the detail). */
function OptionsFigure({ decision }: { decision: Decision }) {
  return (
    <div className={styles.typeset} aria-hidden="true">
      <ol>
        {decision.options.map((o) => (
          <li key={o.label} data-status={o.status}>
            <span className="mono">{o.status === "chosen" ? L.options.chosen : L.options.notChosen}</span>
            <span>{o.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Breaker B, the pinned decision: the decisions stage's finding, then its decisions as steps on
 * the left while a sticky figure on the right swaps (a --dur-base fade) to the current step's
 * figure. Each step: "Decision n — the question", its text, the way we chose and its cost; the
 * options in full are in the options band. Phones, tablets and without JavaScript: each step
 * inline with its figure. The decisions stage's other blocks follow.
 */
export function PinnedDecision({
  id,
  line,
  finding,
  steps,
  after,
  study,
  numbers,
}: {
  id: string;
  line: string;
  finding: string;
  steps: DecisionStep[];
  after: CaseStudy["stages"][number]["blocks"];
  study: CaseStudy;
  numbers: Numbers;
}) {
  return (
    <section id={id} className={`${styles.pinned} container section`} data-breaker="" aria-labelledby={`${id}-heading`}>
      <div className={styles.head} data-quiet-zone>
        <p className={`${styles.line} mono`}>{line}</p>
        <h2 id={`${id}-heading`} className="t-h2">
          {finding}
        </h2>
      </div>
      <div className={styles.steps} style={{ "--steps": steps.length } as CSSProperties} data-pinned="">
        {steps.map((step, i) => {
          const d = step.decision;
          const chosen = d.options.find((o) => o.status === "chosen");
          const spec = step.figure ? study.figures?.[step.figure] : undefined;
          return [
            <article key={`${d.id}-step`} className={styles.step} style={{ "--row": i + 1 } as CSSProperties} data-step={i} aria-labelledby={`${d.id}-heading`} data-quiet-zone>
              <h3 id={`${d.id}-heading`} className="t-h3">
                {`${L.decision(step.number)} — ${d.title}`}
              </h3>
              {d.text?.map((t) => (
                <p key={t} className="body-copy">
                  {t}
                </p>
              ))}
              {chosen && (
                <p className="body-copy">
                  <strong>{`${L.options.taken}: ${chosen.label}.`}</strong> {`${L.options.columns.cost}: ${chosen.cost}`}
                </p>
              )}
              {d.after && <p className="body-copy">{d.after}</p>}
            </article>,
            <div key={`${d.id}-figure`} className={styles.figure} data-step-figure={i} data-active={i === 0 || undefined}>
              {spec ? <Figure spec={{ ...spec, size: "column" }} images={study.images ?? {}} assets={study.assets ?? {}} number={numbers.figures.get(step.figure!)} /> : <OptionsFigure decision={d} />}
            </div>,
          ];
        })}
        <PinnedSwap />
      </div>
      {after.length > 0 && (
        <div className={styles.after}>
          <Blocks blocks={after} study={study} numbers={numbers} />
        </div>
      )}
    </section>
  );
}
