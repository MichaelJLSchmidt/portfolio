import { SignatureLink } from "@/components/motion/SignatureLink";
import { cv } from "@/content/contact";
import { site } from "@/content/site";
import { BernClock } from "./hud/BernClock";
import { HapticsToggle } from "./hud/CalmToggle";
import { CvLink } from "./hud/CvLink";
import { ContactLink } from "./hud/NavLinks";
import styles from "./SiteFooter.module.css";

/**
 * The footer: credits, and on phones the navigation the HUD has no room for there (Expeditions,
 * Contact, CV and the Bern time; Basecamp stays in the bar). The haptics switch stays here.
 */
export function SiteFooter() {
  const nav = site.nav;
  const link = `${styles.navLink} hud-label`;
  return (
    <footer className={`${styles.footer} knockout`} data-chrome="">
      <nav className={styles.nav} aria-label={nav.footerLabel}>
        <ul>
          <li>
            <SignatureLink href="/#expeditions" variant="nav" label={nav.expeditions} className={link} />
          </li>
          <li>
            <ContactLink label={nav.contact} className={link} />
          </li>
          <li>
            <CvLink cv={cv} label={nav.cv} className={link} placeholderClassName={`${link} ${styles.placeholder}`} />
          </li>
        </ul>
        <span className={`${styles.clock} hud-label`}>
          <BernClock label={site.hud.clockLabel} />
        </span>
      </nav>
      <p className={`${styles.credits} hud-label`}>
        <a href={site.footer.creditHref} rel="noopener">
          {site.footer.credit}
        </a>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <span>{site.footer.built}</span>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <span>{site.footer.place}</span>
      </p>
      <HapticsToggle label={site.hud.haptics} />
    </footer>
  );
}
