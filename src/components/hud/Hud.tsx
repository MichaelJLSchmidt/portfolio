import { site } from "@/content/site";
import { BernClock } from "./BernClock";
import { CalmToggle } from "./CalmToggle";
import styles from "./Hud.module.css";

/** Instrument strip: fast, precise, always on top of the slow terrain. */
export function Hud() {
  return (
    <header className={styles.hud}>
      <div className={styles.cluster}>
        <span className={`${styles.mark} hud-label`}>{site.hud.mark}</span>
        <span className={`${styles.credit} hud-label`}>{site.hud.credit}</span>
      </div>
      <span className={`${styles.coords} hud-label`}>{site.hud.coordinates}</span>
      <div className={`${styles.cluster} ${styles.right}`}>
        <span className={`${styles.clock} hud-label`}>
          <span className={styles.live} aria-hidden="true" />
          <BernClock label={site.hud.clockLabel} />
        </span>
        <CalmToggle label={site.hud.calm} />
      </div>
    </header>
  );
}
