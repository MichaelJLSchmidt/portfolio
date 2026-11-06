import { site } from "@/content/site";
import { AboutLink } from "./AboutLink";
import { CalmToggle, HapticsToggle } from "./CalmToggle";
import { HudFrame } from "./HudFrame";
import { HudMark } from "./HudMark";
import { WorkLink } from "./NavLinks";
import styles from "./Hud.module.css";

/**
 * The HUD: one fixed bar, never hidden, the site's only navigation.
 *
 *   start   the brand (home) · Work (the cards on the home page; current on a case study) · About
 *   end     the Calm map switch, and the haptics switch where vibration works
 *
 * Everything stays inline on phones too (no menu); the haptics switch joins the bar from the
 * small breakpoint and sits in the footer below it. Over the page a ground backdrop fades into it;
 * once the page has scrolled it strengthens and the bar condenses (HudFrame).
 */
export function Hud() {
  const nav = site.nav;
  const link = `${styles.navLink} hud-label`;
  return (
    <HudFrame className={styles.hud}>
      <div className={styles.bar}>
        <nav className={styles.start} aria-label={nav.label}>
          <ul className={styles.links}>
            <li>
              <HudMark label={site.brand} name={nav.home} />
            </li>
            <li>
              <WorkLink label={nav.work} className={link} />
            </li>
            <li>
              <AboutLink label={nav.about} className={link} />
            </li>
          </ul>
        </nav>
        <div className={styles.end}>
          <CalmToggle labels={site.hud.calm} />
          <HapticsToggle label={site.hud.haptics} className={styles.sm} />
        </div>
      </div>
    </HudFrame>
  );
}
