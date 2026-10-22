import { Deck } from "@/components/card/Deck";
import { KineticText } from "@/components/type/KineticText";
import { site } from "@/content/site";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main id="main" className={`${styles.main} container`}>
      <section className={styles.hero} aria-labelledby="hero-name">
        <div className={styles.heroMeta}>
          <p className={`${styles.eyebrow} hud-label map-halo reveal`} data-quiet-zone>
            {site.hero.eyebrow}
          </p>
          <p
            className={`${styles.origin} hud-label map-halo keep-halo reveal`}
            style={{ "--reveal-i": 1 } as React.CSSProperties}
            data-quiet-zone
          >
            {site.hero.origin}
          </p>
        </div>
        <KineticText as="h1" id="hero-name" text={site.hero.name} className={`${styles.name} display`} delay={120} proximity quiet />
        <div className={styles.heroFoot}>
          <p className={`${styles.lede} map-halo`} data-quiet-zone>
            {site.hero.lede}
          </p>
          <a
            href="#deck-heading"
            className={`${styles.cue} hud-label map-halo keep-halo reveal`}
            style={{ "--reveal-i": 3 } as React.CSSProperties}
            data-quiet-zone
          >
            <span className={styles.cueLine} aria-hidden="true" />
            {site.hero.scrollCue}
          </a>
        </div>
      </section>
      <Deck />
    </main>
  );
}
