import type { Metadata } from "next";
import { CareerProfile } from "@/components/about/CareerProfile";
import { Title } from "@/components/type/Title";
import { about } from "@/content/about";
import { contact } from "@/content/contact";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: about.meta.title,
  description: about.meta.description,
};

/**
 * About. The field crossfades to Bern. The H1, the intro beside the portrait slot, who I am, the
 * career so far as one drawn line, the leadership band on the sheet (how I lead, how I work with
 * people, how I start with a new team), then the skills, the craft, the cards and the way in.
 */
export default function About() {
  const { portrait } = about;
  return (
    <main id="main" className={`${styles.main} container`}>
      <header className={`${styles.header} grid`}>
        <Title id="about-heading" role="h1" text={about.header.heading} className={styles.title} />
        <p className={`${styles.lead} body-copy`} data-quiet-zone>
          {about.header.lead}
        </p>
        <figure className={styles.portrait}>
          {portrait.image ? (
            <img
              src={portrait.image.sources[0]?.src}
              alt={portrait.alt}
              width={portrait.image.width}
              height={portrait.image.height}
              className={styles.photo}
            />
          ) : (
            <div className={styles.placeholder} role="img" aria-label={portrait.placeholderLabel}>
              <span className="mono">{portrait.placeholderLabel}</span>
            </div>
          )}
        </figure>
      </header>

      <section className={`${styles.who} grid section`} aria-labelledby="who-heading">
        <h2 id="who-heading" className={`${styles.sectionHeading} t-h2`} data-quiet-zone>
          {about.who.heading}
        </h2>
        <div className={styles.bio}>
          {about.who.paragraphs.map((p) => (
            <p key={p} className="body-copy">
              {p}
            </p>
          ))}
        </div>
        <dl className={styles.facts} aria-label={about.who.facts.label}>
          {about.who.facts.rows.map((r) => (
            <div key={r.label} className={styles.fact}>
              <dt className="mono">{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <CareerProfile copy={about.career} className="section" />

      <section className={`${styles.band} section`} data-surface="sheet" aria-labelledby="lead-heading">
        <div className={`${styles.bandInner} grid`}>
          <h2 id="lead-heading" className={`${styles.bandHeading} t-h2`}>
            {about.lead.heading}
          </h2>
          <ol className={styles.principles}>
            {about.lead.principles.map((p, i) => (
              <li key={p.title} className={styles.principle}>
                <span className={`${styles.index} mono`}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="t-h3">{p.title}</h3>
                <p>{p.text}</p>
                <p className={`${styles.evidence} mono`}>
                  {about.lead.evidenceLabel} {p.evidence}
                </p>
              </li>
            ))}
          </ol>

          <h2 id="people-heading" className={`${styles.bandHeading} t-h2`}>
            {about.workingRules.heading}
          </h2>
          <ul className={styles.rules}>
            {about.workingRules.rules.map((r) => (
              <li key={r.lead}>
                <strong>{r.lead}</strong> {r.text}
              </li>
            ))}
          </ul>

          <h2 id="start-heading" className={`${styles.bandHeading} t-h2`}>
            {about.start.heading}
          </h2>
          <ol className={styles.steps}>
            {about.start.steps.map((s, i) => (
              <li key={s.title} className={styles.step}>
                <span className={`${styles.index} mono`}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="t-h3">{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${styles.plain} grid section`} aria-labelledby="skills-heading">
        <h2 id="skills-heading" className={`${styles.sectionHeading} t-h2`} data-quiet-zone>
          {about.skills.heading}
        </h2>
        <dl className={styles.skills}>
          {about.skills.items.map((s) => (
            <div key={s.name} className={styles.skill}>
              <dt className="t-h3">{s.name}</dt>
              <dd>
                <p>{s.text}</p>
                <p className={`${styles.proof} mono`}>
                  {about.skills.proofLabel}: {s.proof}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={`${styles.plain} grid section`} aria-labelledby="craft-heading">
        <h2 id="craft-heading" className={`${styles.sectionHeading} t-h2`} data-quiet-zone>
          {about.craft.heading}
        </h2>
        <p className={`${styles.text} body-copy`}>{about.craft.body}</p>
      </section>

      <section className={`${styles.plain} grid section`} aria-labelledby="cards-heading">
        <h2 id="cards-heading" className={`${styles.sectionHeading} t-h2`} data-quiet-zone>
          {about.cards.heading}
        </h2>
        <div className={styles.text}>
          <p className="body-copy">{about.cards.body}</p>
          <dl className={styles.binder} aria-label={about.cards.listLabel}>
            {about.cards.items.map((c) => (
              <div key={c.name}>
                <dt className="mono">{c.name}</dt>
                <dd>{c.line}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={`${styles.cta} section`} aria-labelledby="about-contact-heading">
        <h2 id="about-contact-heading" className="t-h2">
          {contact.heading}
        </h2>
        <a href="#contact" className="cta">
          {contact.cta}
          <span data-arrow="" aria-hidden="true">
            ↓
          </span>
        </a>
      </section>
    </main>
  );
}
