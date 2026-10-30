import { caseStudyLabels as L } from "@/content/case-study-labels";
import type { Evidence } from "@/lib/case-study";
import styles from "./CaseStudy.module.css";

/** Shape plus text, never colour alone: filled circle, half-filled circle, open diamond. */
const shapes: Record<Evidence, React.ReactNode> = {
  measured: <circle cx="6" cy="6" r="5" pathLength={1} />,
  estimated: (
    <>
      <circle cx="6" cy="6" r="4.4" fill="none" strokeWidth="1.4" pathLength={1} />
      <path d="M6 1.6a4.4 4.4 0 0 0 0 8.8Z" pathLength={1} />
    </>
  ),
  qualitative: <path d="M6 1.2 10.8 6 6 10.8 1.2 6Z" fill="none" strokeWidth="1.4" pathLength={1} />,
};

/** MEASURED, ESTIMATED or QUALITATIVE: how a number was obtained. */
export function EvidenceBadge({ kind }: { kind: Evidence }) {
  return (
    <span className={styles.badge} data-evidence={kind}>
      <svg viewBox="0 0 12 12" aria-hidden="true">
        {shapes[kind]}
      </svg>
      {L.evidence[kind].label}
    </span>
  );
}

/**
 * What each badge on the page means; `notes` replaces the generic explanation per kind. A legend
 * panel: it unfolds like a map sheet as it scrolls into view, and its swatches draw themselves
 * (their outline, then their fill); the text never moves.
 */
export function EvidenceLegend({ kinds, notes }: { kinds: Evidence[]; notes?: Partial<Record<Evidence, string>> }) {
  return (
    <dl className={`${styles.evidenceLegend} body-copy`} aria-label={L.evidenceLegend} data-reveal="sheet" data-fold="left" data-draws="">
      {kinds.map((kind) => (
        <div key={kind}>
          <dt>
            <EvidenceBadge kind={kind} />
          </dt>
          <dd>{notes?.[kind] ?? L.evidence[kind].text}</dd>
        </div>
      ))}
    </dl>
  );
}
