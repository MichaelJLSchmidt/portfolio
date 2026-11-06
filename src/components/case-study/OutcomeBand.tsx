import { Logbook } from "@/components/logbook/Logbook";
import { caseStudyLabels as L } from "@/content/case-study-labels";
import type { CaseStudy, Evidence } from "@/lib/case-study";
import type { SurveyLayout } from "@/lib/survey-layout";
import { Blocks, type Numbers } from "./Blocks";
import { EvidenceBadge, EvidenceLegend } from "./Evidence";
import { Figure } from "./Figure";
import styles from "./OutcomeBand.module.css";

/**
 * The outcome on a sheet band: the outcome stage's finding as its heading, the results as metric
 * tiles (after, from before, the evidence, the stage it was won at; 2×2 on phones), the outcome
 * stage's text and figures, any before/after figure, then what happened after launch. Static:
 * no count-ups, no reveals on the sheet.
 */
export function OutcomeBand({ id, line, outcome, study, numbers }: { id: string; line: string; outcome: SurveyLayout["outcome"]; study: CaseStudy; numbers: Numbers }) {
  const stageName = (n: number) => study.stages[n - 1]?.nav ?? String(n);
  const kinds = (["measured", "estimated", "qualitative"] as const).filter((k) => outcome.results.rows.some((r) => r.evidence === k) || study.summary.outcome.some((o) => o.evidence === k)) as Evidence[];
  return (
    <section id={id} className={styles.band} data-surface="sheet" data-band="" data-breaker="" aria-labelledby={`${id}-heading`}>
      <div className={`${styles.inner} container`}>
        <div className={styles.head}>
          <p className={`${styles.line} mono`}>{line}</p>
          <h2 id={`${id}-heading`} className="t-h2">
            {outcome.stage.finding}
          </h2>
        </div>

        <div className={styles.results}>
          <h3 className={`${styles.resultsHeading} mono`}>{L.resultsHeading}</h3>
          <p className={styles.caption}>{outcome.results.caption}</p>
          <ul className={styles.tiles}>
            {outcome.results.rows.map((r) => (
              <li key={r.metric} className={styles.tile}>
                <span className={`${styles.metric} mono`}>{r.metric}</span>
                <span className={`${styles.after} t-metric`}>{r.after}</span>
                <span className={styles.before}>{L.from(r.before)}</span>
                <span className={styles.meta}>
                  <EvidenceBadge kind={r.evidence} />
                  <span className="mono">{L.wonAt(stageName(r.stage))}</span>
                </span>
              </li>
            ))}
          </ul>
          <EvidenceLegend kinds={kinds} notes={outcome.results.legend} />
        </div>

        <div className={styles.flow}>
          <Blocks blocks={outcome.stage.blocks} study={study} numbers={numbers} reveal={false} />
          {outcome.compare.map((fid) => {
            const spec = study.figures?.[fid];
            return spec ? (
              <div key={fid} data-block="wide">
                <Figure spec={spec} images={study.images ?? {}} assets={study.assets ?? {}} number={numbers.figures.get(fid)} />
              </div>
            ) : null;
          })}
        </div>

        <div className={styles.log}>
          <h3 className="t-h3">{L.afterLaunchHeading}</h3>
          <Logbook caption={outcome.afterLaunch.caption} columns={L.logColumns} rows={outcome.afterLaunch.entries.map((e) => [e.date, e.text])} />
        </div>
      </div>
    </section>
  );
}
