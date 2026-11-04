import { actions, contact, emailAddress } from "@/content/contact";
import { site } from "@/content/site";
import { BernTime } from "./footer/BernTime";
import { CopyAddress } from "./footer/CopyAddress";
import { MotionControl } from "./footer/MotionControl";
import styles from "./SiteFooter.module.css";

/**
 * The footer, in order: "Get in touch" with the email (and LinkedIn, Copy address); the brand
 * wordmark, a link that writes an email; a meta row: Bern time · Motion · © year · the terrain
 * credit. It carries the page's contact anchor (#contact) and safe-area padding.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  const linkedIn = actions.find((a) => a.kind === "linkedin");
  return (
    <footer id="contact" className={styles.footer} aria-labelledby="contact-heading">
      <div className={`${styles.inner} container`}>
        <section className={styles.contact}>
          <h2 id="contact-heading" className="t-h2">
            {contact.heading}
          </h2>
          <p className={`${styles.line} body-copy`}>{contact.line}</p>
          <div className={styles.actions}>
            {emailAddress && (
              <a className={styles.email} href={`mailto:${emailAddress}`}>
                {emailAddress}
              </a>
            )}
            {linkedIn?.href && (
              <a className={`${styles.linkedin} mono`} href={linkedIn.href} rel="noopener">
                {linkedIn.label}
              </a>
            )}
            {emailAddress && <CopyAddress address={emailAddress} />}
          </div>
        </section>

        {emailAddress && (
          <a className={`${styles.wordmark} plain`} href={`mailto:${emailAddress}`} aria-label={site.footer.wordmark(emailAddress)}>
            <span className={styles.word} aria-hidden="true">
              {site.brand}
            </span>
          </a>
        )}

        <div className={`${styles.meta} mono`}>
          <BernTime label={site.footer.clock} className={styles.metaItem} />
          <MotionControl className={styles.metaItem} />
          <span className={styles.metaItem}>{site.footer.copyright(year)}</span>
          <a className={styles.metaItem} href={site.footer.creditHref} rel="noopener">
            {site.footer.credit}
          </a>
        </div>
      </div>
    </footer>
  );
}
