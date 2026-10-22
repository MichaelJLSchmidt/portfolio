import Link from "next/link";
import { site } from "@/content/site";
import { BernClock } from "./BernClock";
import { CalmToggle } from "./CalmToggle";
import styles from "./Hud.module.css";

/** Instrument strip: fast, precise, always on top of the slow terrain. */
export function Hud() {
  return (
    <header className={styles.hud}>
      <div className={styles.cluster}>
        <Link href="/" className={`${styles.mark} hud-label`} aria-label={site.hud.markHome}>
          {site.hud.mark}
        </Link>
        <span className={`${styles.credit} hud-label`}>{site.hud.credit}</span>
      </div>
      <span className={`${styles.coords} hud-label`}>{site.hud.coordinates}</span>
      <div className={`${styles.cluster} ${styles.right}`}>
        <span className={`${styles.clock} hud-label`}>
          <span className={styles.live} aria-hidden="true" />
          <BernClock label={site.hud.clockLabel} />
        </span>
        <span className={styles.row}>
          <Link href="/about/" className={`${styles.navLink} hud-label`}>
            {site.hud.about}
          </Link>
          <CalmToggle label={site.hud.calm} />
        </span>
      </div>
    </header>
  );
}
