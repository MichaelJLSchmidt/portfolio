import type { Metadata } from "next";
import type { CSSProperties } from "react";
import terrain from "@terrain/terrain.json";
import { Deck, type DeckEntry } from "@/components/card/Deck";
import { HeroName } from "@/components/HeroName";
import { ContactBand } from "@/components/home/ContactBand";
import { EarlierWork } from "@/components/home/EarlierWork";
import { LeadPrinciples } from "@/components/home/LeadPrinciples";
import { TrailLink } from "@/components/interaction/TrailLink";
import { Route } from "@/components/route/Route";
import { about } from "@/content/about";
import { cards } from "@/content/cards";
import { caseStudies } from "@/content/case-studies";
import { altitudeLabel, ascentOf } from "@/content/geo";
import { home } from "@/content/home";
import { site } from "@/content/site";
import { formatInteger } from "@/lib/format";
import styles from "./page.module.css";

export const metadata: Metadata = { description: home.meta.description };

/** The home field's sheet: the region's LV95 extent (m) and the field's base zoom. */
const [west, south, east, north] = terrain.region.bboxLv95;
const lv95 = (prefix: string, m: number) => `${prefix} ${formatInteger(m)}`;
const ticks = {
  nw: [lv95("E", west), lv95("N", north)],
  ne: [lv95("E", east), lv95("N", north)],
  sw: [lv95("E", west), lv95("N", south)],
  se: [lv95("E", east), lv95("N", south)],
} as const;

/**
 * Home: a map sheet's title (the name, its tags, the sheet's corner ticks and scale bar), a short
 * intro, how I lead, the work (Selected work, id="work"), earlier work and the way in (Get in
 * touch). Leadership comes before the work, for hiring managers who skim. The red route runs from
 * the title through the four drawings of How I lead and along the ridge of cards to Get in touch.
 */
/** Each card's caption and summit, for the ridge (the deck itself is a client component). */
function deckEntries(): Record<string, DeckEntry> {
  return Object.fromEntries(
    cards.flatMap((c) => {
      const study = caseStudies[c.slug];
      const ascent = ascentOf(c.artwork.kind === "crop" ? c.artwork.terrainId : null);
      if (!study || !ascent) return [];
      const spot = home.workSummit(ascent.summit.label, altitudeLabel(ascent.summit.altitudeM));
      return [[c.slug, { problem: study.lede, result: study.impactLine, role: study.facts.role, spot, metres: ascent.summit.altitudeM }]];
    }),
  );
}

export default function Home() {
  const facts = about.who.facts.rows.filter((r) => (home.intro.facts.rows as readonly string[]).includes(r.label));
  return (
    <main id="main" className={`${styles.main} container`}>
      <Route />
      <section
        className={styles.hero}
        aria-labelledby="hero-name"
        style={{ "--sheet-km-x": (east - west) / 1000, "--sheet-km-y": (north - south) / 1000, "--scale-km": home.hero.scaleKm } as CSSProperties}
      >
        {/* The sheet's furniture: corner ticks at the region's real LV95 coordinates, a scale bar. */}
        <div className={styles.sheet} aria-hidden="true">
          {(Object.keys(ticks) as (keyof typeof ticks)[]).map((corner) => (
            <span key={corner} className={`${styles.tick} hud-label`} data-corner={corner}>
              <span>{ticks[corner][0]}</span>
              <span>{ticks[corner][1]}</span>
            </span>
          ))}
        </div>
        <HeroName name={site.hero.name} className={`${styles.name} display`} />
        <div className={styles.under} data-route="hero">
          <ul className={`${styles.tags} hud-label map-halo`} data-quiet-zone>
            {home.hero.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className={`${styles.scale} hud-label`} aria-hidden="true">
            <span className={styles.scaleBar} />
            {home.hero.scale(home.hero.scaleKm)}
          </p>
        </div>
      </section>
      <section className={styles.intro} aria-label={home.intro.more}>
        <div className={styles.introText}>
          <p className={`${styles.statement} knockout`}>{home.intro.text}</p>
          <TrailLink href="/about/" className={styles.more}>
            {home.intro.more}
          </TrailLink>
        </div>
        <dl className={`${styles.facts} legend`} aria-label={home.intro.facts.label}>
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="hud-label">{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <LeadPrinciples />
      <Deck copy={home.work} cards={cards} entries={deckEntries()} />
      <EarlierWork />
      <ContactBand />
    </main>
  );
}
