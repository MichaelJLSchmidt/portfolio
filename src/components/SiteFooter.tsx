import profile from "@terrain/profile.json";
import { SignatureLink } from "@/components/motion/SignatureLink";
import { cv } from "@/content/contact";
import { site } from "@/content/site";
import { BernClock } from "./hud/BernClock";
import { HapticsToggle } from "./hud/CalmToggle";
import { CvLink } from "./hud/CvLink";
import { ContactLink, ExpeditionsLink } from "./hud/NavLinks";
import styles from "./SiteFooter.module.css";

/** The footer's edge: the Interlaken → Jungfrau elevation profile, every fourth point (viewBox 1000 × 40). */
const points = profile.points as [number, number][];
const { min, max } = profile.elevation;
const edge = points
  .filter((_, i) => i % 4 === 0 || i === points.length - 1)
  .map(([km, m], i) => `${i ? "L" : "M"}${((km / profile.lengthKm) * 1000).toFixed(1)} ${(38 - ((m - min) / (max - min)) * 34).toFixed(1)}`)
  .join("");

/**
 * The footer: an elevation-profile line along its top edge (it traces once as it scrolls into
 * view, over the draw token), credits, and below the medium breakpoint the navigation the HUD has
 * no room for there (Expeditions, Contact, CV and the Bern time; Basecamp stays in the bar). The
 * haptics switch stays here below the small breakpoint. Every link is an inline signature link.
 */
export function SiteFooter() {
  const nav = site.nav;
  const link = `${styles.navLink} hud-label`;
  return (
    <footer className={`${styles.footer} knockout`} data-chrome="">
      <svg className={styles.edge} viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true" data-reveal="line">
        <path d={edge} />
      </svg>
      <nav className={styles.nav} aria-label={nav.footerLabel}>
        <ul>
          <li>
            <ExpeditionsLink label={nav.expeditions} className={link} inline />
          </li>
          <li>
            <ContactLink label={nav.contact} className={link} inline />
          </li>
          <li>
            <CvLink cv={cv} label={nav.cv} className={link} placeholderClassName={`${link} ${styles.placeholder}`} inline />
          </li>
        </ul>
        <BernClock label={site.hud.clockLabel} className={`${styles.clock} hud-label`} />
      </nav>
      <p className={`${styles.credits} hud-label`}>
        <SignatureLink plain href={site.footer.creditHref} rel="noopener" variant="inline" label={site.footer.credit} />
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <span>{site.footer.built}</span>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <span>{site.footer.place}</span>
      </p>
      <HapticsToggle label={site.hud.haptics} className={styles.haptics} />
    </footer>
  );
}
