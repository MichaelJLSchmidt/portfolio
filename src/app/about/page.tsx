import type { Metadata } from "next";
import type { CSSProperties } from "react";
import profile from "@terrain/profile.json";
import { AscentProfile } from "@/components/about/AscentProfile";
import { ContactBand } from "@/components/home/ContactBand";
import { SectionHead } from "@/components/home/SectionHead";
import { MapSheet } from "@/components/motion/MapSheet";
import { SettleText } from "@/components/motion/SettleText";
import { MorphTarget } from "@/components/transition/MorphTarget";
import { about } from "@/content/about";
import { BASECAMP_MORPH } from "@/lib/morph";
import { longestWord } from "@/lib/name-lines";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: about.meta.title,
  description: about.meta.description,
};

/**
 * Basecamp: the About page. Reached from the HUD's Basecamp link, whose label morphs into the H1
 * (BasecampLink) and settles once it has landed; going back, the H1 shrinks into the bar again.
 * Who and where (legend, bio), how I lead (rope rules, first 90 days), the climb so far, then
 * the craft, the person and the way in.
 */
export default function About() {
  // Named ends of the trail on the profile, with their official heights.
  const stops = profile.stops.flatMap((s) => (s.label ? [{ label: s.label, elevation: about.ascent.stops[s.label], at: s.km / profile.lengthKm }] : []));

  return (
    <main id="main" className={`${styles.main} container`}>
      <header className={styles.header} data-quiet-zone>
        <div className={styles.nameCell}>
          <MorphTarget name={BASECAMP_MORPH} variant="title">
            <SettleText
              as="h1"
              text={about.header.heading}
              className={`${styles.name} display`}
              style={{ "--title-chars": longestWord(about.header.heading) } as CSSProperties}
              shine
              glint
              settleOnArrival
            />
          </MorphTarget>
        </div>
        <p className={`${styles.lead} knockout`}>{about.header.lead}</p>
      </header>

      <section className={styles.who} aria-labelledby="legend-heading">
        <MapSheet as="div" className={styles.legend} fold="left">
          <h2 id="legend-heading" className={`${styles.legendHeading} hud-label`}>
            {about.legend.heading}
          </h2>
          <dl className={`${styles.legendRows} surface-copy`}>
            {about.legend.rows.map((r) => (
              <div key={r.label}>
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        </MapSheet>
        <div className={styles.bio}>
          <h2 className={`${styles.bioHeading} hud-label map-halo`}>{about.bio.heading}</h2>
          {about.bio.paragraphs.map((p) => (
            <p key={p} className="body-copy">
              {p}
            </p>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="rope-rules-heading">
        <SectionHead id="rope-rules-heading" eyebrow={about.ropeRules.eyebrow} heading={about.ropeRules.heading} />
        <ul className={styles.ropeRules}>
          {about.ropeRules.rules.map((r) => (
            <li key={r.lead} className="legend">
              <p className="body-copy">
                <strong>{r.lead}</strong> {r.text}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="first-days-heading">
        <SectionHead id="first-days-heading" eyebrow={about.firstDays.eyebrow} heading={about.firstDays.heading} />
        <ol className={styles.days}>
          {about.firstDays.steps.map((s) => (
            <li key={s.title} className={`${styles.day} legend`}>
              <p className={`${styles.dayRange} hud-label`}>{s.days}</p>
              <h3 className={styles.dayTitle}>{s.title}</h3>
              <p className="body-copy">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <AscentProfile labels={about.ascent} camps={about.ascent.camps} stops={stops} />

      <div className={styles.pair}>
        <section className={styles.section} aria-labelledby="craft-heading">
          <SectionHead id="craft-heading" eyebrow={about.craft.eyebrow} heading={about.craft.heading} />
          <p className="body-copy">{about.craft.body}</p>
        </section>
        <section className={styles.section} aria-labelledby="off-map-heading">
          <div className={styles.offMapHead} data-quiet-zone>
            <SettleText as="h2" id="off-map-heading" text={about.offMap.heading} className={`${styles.sectionHeading} display`} trigger="inview" />
          </div>
          <p className="body-copy">{about.offMap.body}</p>
        </section>
      </div>

      <ContactBand line={about.contactLine} />
    </main>
  );
}
