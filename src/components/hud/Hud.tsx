import { TerrainReadout } from "@/components/terrain/TerrainReadout";
import { cv } from "@/content/contact";
import { site } from "@/content/site";
import { BasecampLink } from "./BasecampLink";
import { BernClock } from "./BernClock";
import { CalmToggle, HapticsToggle } from "./CalmToggle";
import { CvLink } from "./CvLink";
import { HudFrame } from "./HudFrame";
import { HudMark } from "./HudMark";
import { ContactLink, ExpeditionsLink } from "./NavLinks";
import styles from "./Hud.module.css";

/**
 * The HUD: a fixed bar of three slots, never hidden.
 *
 *   start   the mark (home) and the navigation: Expeditions · Basecamp · Contact · CV
 *   middle  the terrain readout: what the field behind the page shows
 *   end     the Bern time and the switches (Calm map; Haptics where vibration works)
 *
 * Phones (below the small breakpoint) keep the mark, Basecamp and Calm map; the readout is left
 * out and the rest moves into the footer (SiteFooter). From the small breakpoint the readout
 * (label and altitude) and the haptics switch join; from the medium one the whole navigation;
 * from the large one the time and the readout's coordinates (where vibration works the readout
 * stays compact, so the haptics switch fits). Each slot is its own grid
 * column, so the start and end slots can never run into each other. Over the page a ground
 * backdrop fades into it; once the page has scrolled it strengthens and the bar condenses
 * (HudFrame).
 */
export function Hud() {
  const nav = site.nav;
  const link = `${styles.navLink} hud-label`;
  return (
    <HudFrame className={styles.hud}>
      <div className={styles.bar}>
        <div className={styles.start}>
          <HudMark label={site.hud.mark} name={site.hud.markHome} />
          <nav className={styles.nav} aria-label={nav.label}>
            <ul className={styles.links}>
              <li className={styles.md}>
                <ExpeditionsLink label={nav.expeditions} className={link} />
              </li>
              <li>
                <BasecampLink label={nav.basecamp} className={link} />
              </li>
              <li className={styles.md}>
                <ContactLink label={nav.contact} className={link} />
              </li>
              <li className={styles.md}>
                <CvLink cv={cv} label={nav.cv} className={link} placeholderClassName={`${styles.navLink} ${styles.placeholder} hud-label`} />
              </li>
            </ul>
          </nav>
        </div>
        <div className={styles.middle}>
          <TerrainReadout className={`${styles.readout} hud-label`} />
        </div>
        <div className={styles.end}>
          <BernClock label={site.hud.clockLabel} className={`${styles.clock} ${styles.lg} hud-label`} />
          <CalmToggle labels={site.hud.calm} />
          <HapticsToggle label={site.hud.haptics} className={styles.sm} />
        </div>
      </div>
    </HudFrame>
  );
}
