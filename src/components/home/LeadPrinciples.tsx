import { flood } from "@/content/flood";
import { home } from "@/content/home";
import { LeadIllustration } from "./LeadIllustrations";
import { SectionHead } from "./SectionHead";
import styles from "./Home.module.css";

/**
 * "How I lead" as a switchback: the four principles alternate left and right, a route zig-zagging
 * between them (desktop). Each has its number as a spot height, a plain title, two lines of text,
 * a mono "Evidence:" line and a monoline illustration that draws with the scroll in full motion
 * (drawn at once in calm and still). Phones: one column, each illustration above its principle.
 * The text never moves.
 */
export function LeadPrinciples() {
  const t = home.lead;
  return (
    <section className={styles.section} aria-labelledby="lead-heading">
      <SectionHead id="lead-heading" heading={t.heading} flood={flood.sections.lead} />
      <ol className={styles.switchback}>
        {t.principles.map((r, i) => (
          <li key={r.title} className={styles.turn} data-side={i % 2 ? "right" : "left"}>
            <LeadIllustration name={r.illustration} />
            <div className={`${styles.rule} legend`}>
              <p className={`${styles.ruleNo} hud-label`} aria-hidden="true">
                <svg viewBox="0 0 10 10" className={styles.spot}>
                  <path d="M5 1 9 9H1Z" />
                </svg>
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className={styles.ruleTitle}>{r.title}</h3>
              <p className="body-copy">{r.text}</p>
              <p className={`${styles.evidence} hud-label`}>
                <span className={styles.evidenceLabel}>{t.evidenceLabel}</span> {r.evidence}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
