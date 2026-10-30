import type { Metadata } from "next";
import type { CSSProperties } from "react";
import profile from "@terrain/profile.json";
import { AscentProfile } from "@/components/about/AscentProfile";
import { ContactBand } from "@/components/home/ContactBand";
import { SectionHead } from "@/components/home/SectionHead";
import { MapSheet } from "@/components/motion/MapSheet";
import { WeightTitle } from "@/components/type/WeightTitle";
import { PortraitCard } from "@/components/about/PortraitCard";
import { MorphTarget } from "@/components/transition/MorphTarget";
import { about } from "@/content/about";
import { ABOUT_MORPH } from "@/lib/morph";
import { titleEm } from "@/lib/title-axes";
import { arrival } from "@/styles/tokens";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: about.meta.title,
  description: about.meta.description,
};

/**
 * About. Reached from the HUD's About link, whose label morphs into the H1 (AboutLink) and
 * settles once it has landed; going back, the H1 shrinks into the bar again. Who I am, how I work
 * with people, how I start with a new team, the skills beyond design, the career so far, the
 * cards, the craft and the way in.
 */
export default function About() {
  // Named ends of the trail on the profile, with their official heights.
  const stops = profile.stops.flatMap((s) => (s.label ? [{ label: s.label, elevation: about.career.stops[s.label], at: s.km / profile.lengthKm }] : []));

  return (
    <main id="main" className={`${styles.main} container`}>
      <header className={styles.header}>
        <div className={styles.nameCell} data-quiet-zone>
          <MorphTarget name={ABOUT_MORPH} variant="title">
            <WeightTitle as="h1" text={about.header.heading} className={styles.name} style={{ "--title-em": titleEm(about.header.heading) } as CSSProperties} />
          </MorphTarget>
        </div>
        <p className={`${styles.lead} knockout`}>{about.header.lead}</p>
        <PortraitCard className={styles.portrait} portrait={about.portrait} facts={about.who.facts} />
      </header>

      <section className={styles.who} aria-labelledby="who-heading">
        <MapSheet as="div" className={styles.legend} fold="left" arriveAt={arrival.landed}>
          <p className={`${styles.legendHeading} hud-label`}>{about.who.facts.label}</p>
          {/* The rows fade in one after another; the values never move. */}
          <dl className={`${styles.legendRows} surface-copy`} data-sheet-rows="">
            {about.who.facts.rows.map((r, i) => (
              <div key={r.label} style={{ "--i": i } as CSSProperties}>
                <dt className={styles.legendLabel}>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        </MapSheet>
        <div className={styles.bio}>
          <h2 id="who-heading" className={`${styles.bioHeading} hud-label map-halo knockout`}>
            {about.who.heading}
          </h2>
          {about.who.paragraphs.map((p) => (
            <p key={p} className="body-copy">
              {p}
            </p>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="people-heading">
        <SectionHead id="people-heading" heading={about.workingRules.heading} />
        <ul className={styles.ropeRules}>
          {about.workingRules.rules.map((r) => (
            <li key={r.lead} className="legend">
              <p className="body-copy">
                <strong className={styles.ropeLead}>{r.lead}</strong>{" "}
                {r.text}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="start-heading">
        <SectionHead id="start-heading" heading={about.start.heading} />
        {/* A short contour trail draws between the three steps (across on desktop, down on phones). */}
        <div className={styles.daysWrap}>
          <svg className={styles.daysTrail} viewBox="0 0 300 28" preserveAspectRatio="none" aria-hidden="true" data-reveal="mark">
            <path pathLength={1} d="M50 14C83 4 117 24 150 14S217 4 250 14" />
          </svg>
          <svg className={styles.daysTrailDown} viewBox="0 0 16 300" preserveAspectRatio="none" aria-hidden="true" data-reveal="mark">
            <path pathLength={1} d="M8 6C2 56 14 106 8 150S2 244 8 294" />
          </svg>
          <ol className={styles.days}>
            {about.start.steps.map((s) => (
              <li key={s.title} className={`${styles.day} legend`}>
                <h3 className={styles.dayTitle}>{s.title}</h3>
                <p className="body-copy">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="skills-heading">
        <SectionHead id="skills-heading" heading={about.skills.heading} />
        <ul className={styles.ropeRules}>
          {about.skills.items.map((s) => (
            <li key={s.name} className="legend">
              <h3 className={styles.dayTitle}>{s.name}</h3>
              <p className="body-copy">{s.text}</p>
              <p className="hud-label">
                {about.skills.proofLabel}: {s.proof}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <AscentProfile labels={about.career} camps={about.career.camps} stops={stops} />

      <div className={styles.pair}>
        <section className={styles.section} aria-labelledby="cards-heading">
          <SectionHead id="cards-heading" heading={about.cards.heading} />
          <p className="body-copy">{about.cards.body}</p>
        </section>
        <section className={styles.section} aria-labelledby="craft-heading">
          <SectionHead id="craft-heading" heading={about.craft.heading} />
          <p className="body-copy">{about.craft.body}</p>
        </section>
      </div>

      <ContactBand />
    </main>
  );
}
