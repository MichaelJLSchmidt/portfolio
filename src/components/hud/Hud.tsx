import Link from "next/link";
import { SignatureLink } from "@/components/motion/SignatureLink";
import { cv } from "@/content/contact";
import { site } from "@/content/site";
import { BasecampLink } from "./BasecampLink";
import { BernClock } from "./BernClock";
import { CalmToggle } from "./CalmToggle";
import { CvLink } from "./CvLink";
import { ContactLink } from "./NavLinks";
import styles from "./Hud.module.css";

/**
 * Instrument strip and main navigation, left to right: the mark (home) · Expeditions · Basecamp ·
 * Contact · CV · Bern time · Calm map. On phones the bar keeps the mark, Basecamp and the switch;
 * Expeditions, Contact, CV and the time move into the footer (SiteFooter), so 360 px never
 * overflows. Fast, precise, always on top of the slow terrain.
 */
export function Hud() {
  const nav = site.nav;
  const link = `${styles.navLink} hud-label`;
  return (
    <header className={styles.hud} data-chrome="">
      <Link href="/" className={`${styles.mark} hud-label`} aria-label={site.hud.markHome}>
        {site.hud.mark}
      </Link>
      <nav className={styles.nav} aria-label={nav.label}>
        <ul className={styles.links}>
          <li className={styles.wide}>
            <SignatureLink href="/#expeditions" variant="nav" label={nav.expeditions} className={link} />
          </li>
          <li>
            <BasecampLink label={nav.basecamp} className={link} />
          </li>
          <li className={styles.wide}>
            <ContactLink label={nav.contact} className={link} />
          </li>
          <li className={styles.wide}>
            <CvLink cv={cv} label={nav.cv} className={link} placeholderClassName={`${link} ${styles.placeholder}`} />
          </li>
        </ul>
      </nav>
      <span className={`${styles.clock} ${styles.wide} hud-label`}>
        <span className={styles.live} aria-hidden="true" />
        <BernClock label={site.hud.clockLabel} className={styles.time} />
      </span>
      <CalmToggle labels={site.hud.calm} />
    </header>
  );
}
