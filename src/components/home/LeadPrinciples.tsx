import { flood } from "@/content/flood";
import { home } from "@/content/home";
import { SectionHead } from "./SectionHead";
import styles from "./Home.module.css";

/**
 * "How I lead": four principles, each with the evidence that it is practised, on legend panels.
 * Each evidence line fades in as it comes into view; the text never moves.
 */
export function LeadPrinciples() {
  const t = home.lead;
  return (
    <section className={styles.section} aria-labelledby="lead-heading">
      <SectionHead id="lead-heading" heading={t.heading} flood={flood.sections.lead} />
      <ol className={styles.rules}>
        {t.principles.map((r, i) => (
          <li key={r.title} className={`${styles.rule} legend`}>
            <span className={`${styles.ruleNo} hud-label`} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className={styles.ruleTitle}>{r.title}</h3>
            <p className="body-copy">{r.text}</p>
            <p className={`${styles.evidence} body-copy`} data-reveal="fade">
              <span className="hud-label">{t.evidenceLabel}</span> {r.evidence}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
