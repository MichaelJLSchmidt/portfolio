import { home } from "@/content/home";
import { SectionHead } from "./SectionHead";
import styles from "./Home.module.css";

/** "Alignment is a design problem": how I run workshops, the formats, and the proof. */
export function Workshops() {
  const t = home.workshops;
  return (
    <section className={styles.section} aria-labelledby="workshops-heading">
      <SectionHead id="workshops-heading" eyebrow={t.eyebrow} heading={t.heading} />
      <div className={`${styles.workshops} legend`}>
        <p className="body-copy">{t.lead}</p>
        <ul className={styles.formats} aria-label={t.formatsLabel} data-reveal="">
          {t.formats.map((f) => (
            <li key={f.name} className={styles.format}>
              <span className={styles.formatName}>{f.name}</span>
              <span className="hud-label">{f.length}</span>
            </li>
          ))}
        </ul>
        <p className={`${styles.proof} body-copy`}>
          <strong>{t.proof.count}</strong> {t.proof.text}
        </p>
      </div>
    </section>
  );
}
