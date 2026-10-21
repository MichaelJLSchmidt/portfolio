import { Deck } from "@/components/card/Deck";
import { site } from "@/content/site";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main id="main" className={styles.main}>
      <section className={styles.hero} aria-labelledby="hero-name">
        <p className={`${styles.eyebrow} hud-label map-halo`}>{site.hero.eyebrow}</p>
        <h1 id="hero-name" className={`${styles.name} display`}>
          {site.hero.name}
        </h1>
        <p className={`${styles.origin} hud-label map-halo`}>{site.hero.origin}</p>
        <p className={`${styles.lede} map-halo`}>{site.hero.lede}</p>
      </section>
      <Deck />
    </main>
  );
}
