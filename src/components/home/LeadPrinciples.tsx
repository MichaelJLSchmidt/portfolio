import { SettleText } from "@/components/motion/SettleText";
import { home } from "@/content/home";
import { stagger } from "@/styles/tokens";
import { SectionHead } from "./SectionHead";
import styles from "./Home.module.css";

/**
 * "How I lead": four principles, each with the evidence that it is practised, on legend panels.
 * As the principles come into view their titles settle as a group (one after another, the item
 * stagger), and each evidence line fades in --dur-tap after its title; the text never moves.
 */
export function LeadPrinciples() {
  const t = home.lead;
  return (
    <section className={styles.section} aria-labelledby="lead-heading">
      <SectionHead id="lead-heading" heading={t.heading} />
      <ol className={styles.rules}>
        {t.principles.map((r, i) => (
          <li key={r.title} className={`${styles.rule} legend`}>
            <span className={`${styles.ruleNo} hud-label`} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <SettleText as="h3" text={r.title} mode="block" wrap role="text" trigger="inview" delay={Math.min(i, stagger.item.max - 1) * stagger.item.step} className={styles.ruleTitle} />
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
