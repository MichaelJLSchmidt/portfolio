import { actions } from "@/content/contact";
import { home } from "@/content/home";
import { ActionLinks } from "./ActionLinks";
import { SectionHead } from "./SectionHead";
import styles from "./Home.module.css";

/** "Planning a climb that needs a lead?": the closing band on home and Basecamp (#contact). */
export function ContactBand({ line }: { line?: string }) {
  const t = home.contact;
  return (
    <section id="contact" className={`${styles.section} ${styles.contact}`} aria-labelledby="contact-heading">
      <SectionHead id="contact-heading" eyebrow={t.eyebrow} heading={t.heading} align="center">
        <p className={`${styles.contactLine} body-copy`}>{line ?? t.line}</p>
      </SectionHead>
      <ActionLinks links={actions.map((a, i) => ({ ...a, primary: i === 0 }))} className={styles.contactActions} />
    </section>
  );
}
