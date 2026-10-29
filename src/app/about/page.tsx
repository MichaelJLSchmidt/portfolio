import type { Metadata } from "next";
import type { CSSProperties } from "react";
import profile from "@terrain/profile.json";
import { Actions } from "@/components/about/Actions";
import { AscentProfile } from "@/components/about/AscentProfile";
import { SummitSummary } from "@/components/SummitSummary";
import { MorphTarget } from "@/components/transition/MorphTarget";
import { SettleText } from "@/components/motion/SettleText";
import { about } from "@/content/about";
import { hasValue, withValues } from "@/lib/content";
import { BASECAMP_MORPH } from "@/lib/morph";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: about.meta.title,
  description: about.meta.description,
};

/**
 * Basecamp: the About page. Reached from the HUD's Basecamp link, whose label morphs into the H1
 * (BasecampLink) and settles once it has landed; going back, the H1 shrinks into the bar again.
 */
export default function About() {
  // Named ends of the trail on the profile, with their official heights.
  const stops = profile.stops.flatMap((s) => (s.label ? [{ label: s.label, elevation: about.ascent.stops[s.label], at: s.km / profile.lengthKm }] : []));

  return (
    <main id="main" className={`${styles.main} container`}>
      <header className={styles.header}>
        <div className={styles.intro} data-quiet-zone>
          <p className={`${styles.eyebrow} hud-label map-halo`} data-reveal="">
            {about.header.eyebrow}
          </p>
          <MorphTarget name={BASECAMP_MORPH} variant="title">
            <SettleText as="h1" text={about.header.heading} className={`${styles.name} display`} shine glint settleOnArrival />
          </MorphTarget>
          <p className={`${styles.role} map-halo`} data-reveal="">
            {about.header.role}
            <span className={`${styles.place} hud-label map-halo keep-halo`}>{about.header.place}</span>
          </p>
          <p className={`${styles.statement} body-copy`}>{about.header.statement}</p>
          <Actions actions={about.actions} reveal />
        </div>
      </header>

      <SummitSummary
        id="basecamp-summary"
        heading={about.summary.heading}
        rows={about.summary.rows}
      />

      <AscentProfile labels={about.ascent} milestones={about.ascent.milestones} stops={stops} />

      <section className={styles.section} aria-labelledby="rope-team-heading" data-vt-exit>
        <div className={styles.sectionHead} data-quiet-zone>
          <SettleText as="h2" id="rope-team-heading" text={about.principles.heading} className={`${styles.sectionHeading} display`} trigger="inview" />
          <p className="body-copy">{about.principles.intro}</p>
        </div>
        <ol className={styles.markers}>
          {about.principles.items.map((p) => (
            <li key={p.title} className={`${styles.marker} legend`}>
              <span className={styles.blaze} aria-hidden="true" />
              <h3 className={`${styles.markerTitle} display`}>{p.title}</h3>
              <p className="body-copy">{p.body}</p>
              {hasValue(p.metric) && <p className={`${styles.metric} hud-label`}>{p.metric}</p>}
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="craft-heading" data-vt-exit>
        <div className={styles.sectionHead} data-quiet-zone>
          <SettleText as="h2" id="craft-heading" text={about.craft.heading} className={`${styles.sectionHeading} display`} trigger="inview" />
          <p className="body-copy">{about.craft.intro}</p>
        </div>
        <ul className={styles.plaques}>
          {about.craft.items.map((c) => {
            const stats = withValues(c.stats);
            return (
              <li key={c.term} className={styles.plaque}>
                <h3 className={`${styles.plaqueTerm} display`}>{c.term}</h3>
                <p className={`${styles.reminder} italic`}>{c.reminder}</p>
                <p className="body-copy">{c.evidence}</p>
                {stats.length > 0 && (
                  <dl className={styles.plaqueStats} style={{ "--cells": stats.length } as CSSProperties}>
                    {stats.map((s) => (
                      <div key={s.label}>
                        <dt>{s.label}</dt>
                        <dd>{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={`${styles.section} ${styles.offTrail}`} aria-labelledby="off-trail-heading" data-vt-exit>
        <SettleText as="h2" id="off-trail-heading" text={about.offTrail.heading} className={`${styles.sectionHeading} display`} trigger="inview" quiet />
        <div className={`${styles.offTrailBody} legend`}>
          <p className="body-copy">{about.offTrail.body}</p>
          <p className={`${styles.flavor} italic`}>{about.offTrail.flavor}</p>
        </div>
      </section>

      <section className={styles.contact} aria-labelledby="contact-heading" data-quiet-zone data-vt-exit>
        <SettleText as="h2" id="contact-heading" text={about.contact.heading} className={`${styles.contactHeading} display`} trigger="inview" shine />
        <p className="body-copy">{about.contact.body}</p>
        <Actions actions={about.actions} />
      </section>
    </main>
  );
}
