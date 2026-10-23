import { Deck } from "@/components/card/Deck";
import { HeroName } from "@/components/HeroName";
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
        <HeroName name={site.hero.name} className={`${styles.name} display`} />
        <div className={styles.aside}>
          <p className="body-copy reveal" style={{ "--reveal-i": 2 } as React.CSSProperties}>
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
