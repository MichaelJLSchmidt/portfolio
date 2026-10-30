import type { Metadata } from "next";
import { Deck } from "@/components/card/Deck";
import { HeroName } from "@/components/HeroName";
import { SettleText } from "@/components/motion/SettleText";
import { ActionLinks } from "@/components/home/ActionLinks";
import { ContactBand } from "@/components/home/ContactBand";
import { FieldNotes } from "@/components/home/FieldNotes";
import { SummitLog } from "@/components/home/SummitLog";
import { TrailRules } from "@/components/home/TrailRules";
import { Workshops } from "@/components/home/Workshops";
import { cv } from "@/content/contact";
import { home } from "@/content/home";
import { site } from "@/content/site";
import styles from "./page.module.css";

export const metadata: Metadata = { description: home.meta.description };

/**
 * Home: who and at what level (hero), what changed (Summit log), how I lead (Trail rules), then
 * the work (Expeditions), what others say (Field notes), how I align people (Workshops) and the
 * way in (Contact).
 */
export default function Home() {
  const t = home.hero;
  return (
    <main id="main" className={`${styles.main} container`}>
      <section className={styles.hero} aria-labelledby="hero-name">
        <SettleText as="p" text={t.eyebrow.join(" · ")} mode="chars" role="mono" quiet className={`${styles.eyebrow} hud-label map-halo`} />
        <HeroName name={site.hero.name} className={`${styles.name} display`} />
        <div className={styles.aside}>
          <p className={`${styles.statement} knockout`}>{t.statement}</p>
          <p className="body-copy">{t.support}</p>
          <ActionLinks
            className={styles.heroActions}
            links={[
              { label: t.actions.expeditions, href: "/#expeditions", arrow: "↓", primary: true },
              { label: t.actions.basecamp, href: "/about/", arrow: "→" },
              { label: cv.label, href: cv.href, kind: "cv" },
            ]}
          />
          <a href="#expeditions" className={`${styles.cue} hud-label map-halo keep-halo`} data-reveal="" data-quiet-zone>
            <span className={styles.cueLine} aria-hidden="true" />
            {t.scrollCue}
          </a>
        </div>
      </section>
      <SummitLog />
      <TrailRules />
      <Deck copy={home.expeditions} />
      <FieldNotes />
      <Workshops />
      <ContactBand />
    </main>
  );
}
