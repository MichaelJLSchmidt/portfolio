import { actions } from "@/content/contact";
import { home } from "@/content/home";
import { ActionLinks } from "./ActionLinks";
import { CopyAddress } from "./CopyAddress";
import { SectionHead } from "./SectionHead";
import styles from "./Home.module.css";

/** "Planning a climb that needs a lead?": the closing band on home and Basecamp (#contact). */
export function ContactBand({ line }: { line?: string }) {
  const t = home.contact;
  const href = actions.find((a) => a.kind === "email")?.href;
  const email = href?.startsWith("mailto:") ? href.slice("mailto:".length) : null;
  return (
    <section id="contact" className={`${styles.section} ${styles.contact}`} aria-labelledby="contact-heading">
      <SectionHead id="contact-heading" eyebrow={t.eyebrow} heading={t.heading} align="center">
        <p className={`${styles.contactLine} body-copy`}>{line ?? t.line}</p>
      </SectionHead>
      <ActionLinks
        links={actions.map((a, i) => ({ ...a, primary: i === 0 }))}
        className={styles.contactActions}
        after={email ? { email: <CopyAddress address={email} className={styles.copy} /> } : undefined}
      />
    </section>
  );
}
