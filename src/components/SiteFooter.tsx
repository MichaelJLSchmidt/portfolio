import profile from "@terrain/profile.json";
import { TrailLink } from "@/components/interaction/TrailLink";
import { emailAddress } from "@/content/contact";
import { site } from "@/content/site";
import { Wordmark } from "./footer/Wordmark";
import { HapticsToggle } from "./hud/CalmToggle";
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
 * view, over the draw token), the outline wordmark, the email address again and the credits. The
 * haptics switch sits here below the small breakpoint, where the HUD has no room for it.
 */
export function SiteFooter() {
  return (
    <footer className={`${styles.footer} knockout`} data-chrome="">
      <svg className={styles.edge} viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true" data-reveal="line">
        <path d={edge} />
      </svg>
      <Wordmark className={styles.wordmark} />
      {emailAddress && (
        <p className={styles.email}>
          <TrailLink plain href={`mailto:${emailAddress}`} variant="inline">
            {emailAddress}
          </TrailLink>
        </p>
      )}
      <p className={`${styles.credits} hud-label`}>
        <TrailLink plain href={site.footer.creditHref} rel="noopener" variant="inline">
          {site.footer.credit}
        </TrailLink>
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
