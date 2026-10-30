import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { BinderPage, type PocketView } from "@/components/about/BinderPage";
import { CareerProfile } from "@/components/about/CareerProfile";
import { FieldKit } from "@/components/about/FieldKit";
import { ContactBand } from "@/components/home/ContactBand";
import { SectionHead } from "@/components/home/SectionHead";
import { MapSheet } from "@/components/motion/MapSheet";
import { WeightTitle } from "@/components/type/WeightTitle";
import { PortraitCard } from "@/components/about/PortraitCard";
import { MorphTarget } from "@/components/transition/MorphTarget";
import { about, pocketName } from "@/content/about";
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
 * settles once it has landed; going back, the H1 shrinks into the bar again. The title holds the
 * portrait card between its layers: the letters run behind the head, one stem of the last letter
 * in front of the shoulders (a clipped copy of the title, hidden from screen readers). Then who I
 * am, how I work with people, how I start with a new team, the skills beyond design, the career
 * so far, the cards, the craft and the way in.
 */
export default function About() {
  const heading = about.header.heading;
  const titleStyle = { "--title-em": titleEm(heading) } as CSSProperties;
  const binder = about.cards.binder;
  const pockets: PocketView[] = binder.pockets.map((p) =>
    p.kind === "empty" ? p : { ...p, name: pocketName(p), label: p.kind === "deck" ? binder.deckBox : pocketName(p) },
  );

  return (
    <main id="main" className={`${styles.main} container`}>
      <header className={styles.header}>
        <div className={styles.titleCell} data-quiet-zone>
          <div className={styles.titleBox} style={titleStyle}>
            <MorphTarget name={ABOUT_MORPH} variant="title">
              <WeightTitle as="h1" text={heading} className={styles.name} />
            </MorphTarget>
            <PortraitCard className={styles.portrait} portrait={about.portrait} facts={about.who.facts} />
            <span className={styles.stemLayer} aria-hidden="true">
              <WeightTitle as="span" arrive="none" text={heading} className={`${styles.name} ${styles.stem}`} />
            </span>
          </div>
        </div>
        <p className={`${styles.lead} knockout`}>{about.header.lead}</p>
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
        <FieldKit copy={about.skills} />
      </section>

      <CareerProfile copy={about.career} />

      <section className={styles.cards} aria-labelledby="cards-heading">
        <div className={styles.cardsText}>
          <SectionHead id="cards-heading" heading={about.cards.heading} />
          <p className="body-copy">{about.cards.body}</p>
          <div className={styles.binderList} data-quiet-zone>
            <p className={`${styles.binderListLabel} hud-label map-halo`}>{binder.listLabel}</p>
            <dl>
              {pockets.flatMap((p) =>
                p.kind === "empty"
                  ? []
                  : [
                      <div key={p.name}>
                        <dt className="hud-label map-halo">{p.name}</dt>
                        <dd>{p.line}</dd>
                      </div>,
                    ],
              )}
            </dl>
          </div>
        </div>
        <BinderPage className={styles.binder} label={binder.label} empty={binder.empty} pockets={pockets} />
      </section>

      <section className={styles.section} aria-labelledby="craft-heading">
        <SectionHead id="craft-heading" heading={about.craft.heading} />
        <p className={`${styles.craft} body-copy`}>{about.craft.body}</p>
      </section>

      <ContactBand />
    </main>
  );
}
