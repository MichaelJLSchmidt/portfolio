import type { home } from "@/content/home";
import styles from "./EarlierProjects.module.css";

/**
 * Earlier projects: a plain list, newest first, one row each (year · type of project, sector ·
 * role) with hairline separators. A row becomes a link, with an arrow, only once it has an `href`.
 * Rows are at least 56 px high on phones. Nothing moves.
 */
export function EarlierProjects({ copy: t, className }: { copy: typeof home.earlier; className?: string }) {
  return (
    <section className={className ? `${styles.earlier} ${className}` : styles.earlier} aria-labelledby="earlier-heading">
      <h2 id="earlier-heading" className="t-h2" data-quiet-zone>
        {t.heading}
      </h2>
      <ol className={styles.list} aria-label={t.caption}>
        {t.entries.map((e) => {
          const content = (
            <>
              <span className={`${styles.year} mono`}>{e.year}</span>
              <span className={styles.type}>
                {e.type}
                <span className={styles.sector}>, {e.sector}</span>
              </span>
              <span className={`${styles.role} mono`}>{e.role}</span>
              {e.href && (
                <span className={styles.arrow} aria-hidden="true" data-arrow="">
                  →
                </span>
              )}
            </>
          );
          return (
            <li key={`${e.year}-${e.type}`} className={styles.item}>
              {e.href ? (
                <a href={e.href} className={`${styles.row} cta plain`}>
                  {content}
                </a>
              ) : (
                <div className={styles.row}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
