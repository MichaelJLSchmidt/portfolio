import { actions, contact, emailAddress } from "@/content/contact";
import { flood } from "@/content/flood";
import { ActionLinks } from "./ActionLinks";
import { CopyAddress } from "./CopyAddress";
import { SectionHead } from "./SectionHead";
import styles from "./Home.module.css";

/** "Get in touch": the closing section on home and About (#contact): email, LinkedIn, Copy address. */
export function ContactBand() {
  return (
    <section id="contact" className={`${styles.section} ${styles.contact}`} aria-labelledby="contact-heading" data-route="contact">
      <SectionHead id="contact-heading" heading={contact.heading} align="center" flood={flood.sections.contact}>
        <p className={`${styles.contactLine} body-copy`}>{contact.line}</p>
      </SectionHead>
      <ActionLinks
        links={actions.map((a, i) => ({ ...a, arrow: "→", primary: i === 0 }))}
        className={styles.contactActions}
        after={emailAddress ? { email: <CopyAddress address={emailAddress} className={styles.copy} /> } : undefined}
      />
    </section>
  );
}
