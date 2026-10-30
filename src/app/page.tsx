import type { Metadata } from "next";
import { Deck } from "@/components/card/Deck";
import { HeroName } from "@/components/HeroName";
import { ContactBand } from "@/components/home/ContactBand";
import { LeadPrinciples } from "@/components/home/LeadPrinciples";
import { SignatureLink } from "@/components/motion/SignatureLink";
import { home } from "@/content/home";
import { site } from "@/content/site";
import styles from "./page.module.css";

export const metadata: Metadata = { description: home.meta.description };

/**
 * Home: the name and what I do (tags), a short intro, how I lead, then the work (Selected work,
 * id="work"), and the way in (Get in touch). Leadership comes before the work, for hiring
 * managers who skim.
 */
export default function Home() {
  return (
    <main id="main" className={`${styles.main} container`}>
      <section className={styles.hero} aria-labelledby="hero-name">
        <HeroName name={site.hero.name} className={`${styles.name} display`} />
        <ul className={`${styles.tags} hud-label map-halo`} data-quiet-zone>
          {home.hero.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
      <section className={styles.intro} aria-label={home.intro.more}>
        <p className={`${styles.statement} knockout`}>{home.intro.text}</p>
        <SignatureLink href="/about/" variant="standalone" label={home.intro.more} arrow="→" className={styles.more} />
      </section>
      <LeadPrinciples />
      <Deck copy={home.work} />
      <ContactBand />
    </main>
  );
}
