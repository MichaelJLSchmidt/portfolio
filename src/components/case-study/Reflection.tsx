import { caseStudyLabels as L } from "@/content/case-study-labels";
import type { SurveyLayout } from "@/lib/survey-layout";
import styles from "./Reflection.module.css";

/**
 * Reflection, six columns, centred: each lesson with what I would do next time, then what I did
 * not do and the credits.
 */
export function Reflection({ id, line, reflection }: { id: string; line: string; reflection: SurveyLayout["reflection"] }) {
  return (
    <section id={id} className={`${styles.reflection} container section`} aria-labelledby={`${id}-heading`}>
      <div className={styles.inner} data-quiet-zone>
        <p className={`${styles.line} mono`}>{line}</p>
        <h2 id={`${id}-heading`} className="t-h2">
          {L.lookingBack}
        </h2>
        <ol className={styles.lessons}>
          {reflection.lookingBack.map((l) => (
            <li key={l.lesson} data-reveal="">
              <p className={styles.lesson}>{l.lesson}</p>
              <p className="body-copy">{l.nextTime}</p>
            </li>
          ))}
        </ol>
        <p className="body-copy">
          <strong>{`${L.didNotDo}: `}</strong>
          {reflection.didNotDo}
        </p>
        <p className={`${styles.credits} body-copy`}>
          <span className="mono">{L.credits}</span> {reflection.credits}
        </p>
      </div>
    </section>
  );
}
