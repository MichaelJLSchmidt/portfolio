import { caseStudyLabels as L } from "@/content/case-study-labels";
import type { SurveyLayout } from "@/lib/survey-layout";
import { EvidenceBadge } from "./Evidence";
import styles from "./SummaryBand.module.css";

/**
 * The summary on a sheet band (ink on the light sheet): Problem, My role, Team · Duration · Reach,
 * Key decision, Outcome (each result with its evidence). On phones My role and Team come first.
 * Nothing on the sheet moves.
 */
export function SummaryBand({ id, summary }: { id: string; summary: SurveyLayout["summary"] }) {
  return (
    <section id={id} className={styles.band} data-surface="sheet" data-band="" data-breaker="" data-vt-part="summary" aria-labelledby={`${id}-heading`}>
      <div className={`${styles.inner} container grid`}>
        <h2 id={`${id}-heading`} className={`${styles.heading} mono`}>
          {L.summaryHeading}
        </h2>
        <dl className={styles.list}>
          <div className={styles.problem}>
            <dt className="mono">{L.summary.problem}</dt>
            <dd className={styles.lead}>{summary.problem}</dd>
          </div>
          <div className={styles.role}>
            <dt className="mono">{L.summary.role}</dt>
            <dd>{summary.role}</dd>
          </div>
          <div className={styles.team}>
            <dt className="mono">{L.summary.team}</dt>
            <dd>{summary.team.join(" · ")}</dd>
          </div>
          <div className={styles.decision}>
            <dt className="mono">{L.summary.keyDecision}</dt>
            <dd>{summary.keyDecision}</dd>
          </div>
          <div className={styles.outcome}>
            <dt className="mono">{L.summary.outcome}</dt>
            <dd>
              <ul className={styles.outcomes}>
                {summary.outcome.map((o) => (
                  <li key={o.text}>
                    <span>{o.text}</span> <EvidenceBadge kind={o.evidence} />
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
        {summary.note && <p className={`${styles.note} mono`}>{summary.note}</p>}
      </div>
    </section>
  );
}
