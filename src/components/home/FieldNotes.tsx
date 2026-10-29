import { isExample } from "@/content/example-values";
import { home } from "@/content/home";
import { SectionHead } from "./SectionHead";
import styles from "./Home.module.css";

// Invented quotes exist only where flagged examples do (basecamp builds and previews), never in a
// live build, even one built as a preview: there they are left out, and without a real quote the
// section is not rendered at all. (A real live build stops earlier: check:content lists them.)
const showExamples = process.env.NEXT_PUBLIC_EXAMPLES === "1";

/** "From the people on the rope": testimonials, each an example until real ones replace it. */
export function FieldNotes() {
  const t = home.fieldNotes;
  const notes = t.notes.filter((n) => showExamples || !isExample(n.quote));
  if (!notes.length) return null;
  return (
    <section className={styles.section} aria-labelledby="field-notes-heading">
      <SectionHead id="field-notes-heading" eyebrow={t.eyebrow} heading={t.heading} />
      <ul className={styles.notes}>
        {notes.map((n) => (
          <li key={n.quote} className={`${styles.note} legend`}>
            <figure>
              {isExample(n.quote) && <p className={`${styles.exampleTag} hud-label`}>{t.exampleTag}</p>}
              <blockquote>
                <p className={`${styles.noteQuote} body-copy`}>“{n.quote}”</p>
              </blockquote>
              <figcaption className={`${styles.noteSource} hud-label`}>— {n.source}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
