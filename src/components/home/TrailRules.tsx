import { home } from "@/content/home";
import { SectionHead } from "./SectionHead";
import styles from "./Home.module.css";

/** "How I lead": four rules, each with the evidence that it is practised, on legend panels. */
export function TrailRules() {
  const t = home.trailRules;
  return (
    <section className={styles.section} aria-labelledby="trail-rules-heading">
      <SectionHead id="trail-rules-heading" eyebrow={t.eyebrow} heading={t.heading} />
      <ol className={styles.rules}>
        {t.rules.map((r, i) => (
          <li key={r.title} className={`${styles.rule} legend`}>
            <span className={`${styles.ruleNo} hud-label`} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className={styles.ruleTitle}>{r.title}</h3>
            <p className="body-copy">{r.text}</p>
            <p className={`${styles.evidence} body-copy`}>
              <span className="hud-label">{t.evidenceLabel}</span> {r.evidence}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
