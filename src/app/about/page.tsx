import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import profile from "@terrain/profile.json";
import { Actions } from "@/components/about/Actions";
import { AscentProfile } from "@/components/about/AscentProfile";
import { CardArtwork } from "@/components/card/CardArtwork";
import { SummitSummary } from "@/components/SummitSummary";
import { MorphTarget } from "@/components/transition/MorphTarget";
import { KineticText } from "@/components/type/KineticText";
import { about } from "@/content/about";
import { caseStudyLabels as L, cardBySlug } from "@/content/cards";
import { hasValue, withValues } from "@/lib/content";
import { morphName } from "@/lib/morph";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: about.meta.title,
  description: about.meta.description,
};

const reveal = (i: number) => ({ "--reveal-i": i }) as CSSProperties;

/** Basecamp: the About page, opened from the leader card (its art and name morph in). */
export default function About() {
  const leader = cardBySlug(about.cardSlug)!;
  // Named waypoints on the profile, with the official heights from the card content.
  const waypoints = leader.artwork.kind === "crop" ? leader.artwork.waypoints : [];
  const stops = profile.stops.flatMap((s) =>
    s.label
      ? [{ label: s.label, elevation: waypoints.find((w) => w.label === s.label)?.elevation, at: s.km / profile.lengthKm }]
      : [],
  );

  return (
    <main id="main" className={`${styles.main} container`}>
      <nav className={styles.crumbs} aria-label={L.back}>
        <Link href="/" className="hud-label">
          <span aria-hidden="true">←</span> {L.back}
        </Link>
      </nav>

      <header className={styles.header}>
        <MorphTarget name={morphName("art", leader.slug)} variant="art" className={styles.artSlot}>
          <CardArtwork artwork={leader.artwork} alt={leader.artworkAlt} className={styles.art} />
        </MorphTarget>
        <div className={styles.intro} data-quiet-zone>
          <p className={`${styles.eyebrow} hud-label map-halo reveal`}>{about.header.eyebrow}</p>
          <MorphTarget name={morphName("title", leader.slug)} variant="title">
            <KineticText as="h1" text={about.header.name} className={`${styles.name} display`} delay={420} proximity settleOnArrival />
          </MorphTarget>
          <p className={`${styles.role} map-halo reveal`} style={reveal(1)}>
            {about.header.role}
            <span className={`${styles.place} hud-label map-halo keep-halo`}>{about.header.place}</span>
          </p>
          <p className={`${styles.statement} body-copy reveal`} style={reveal(2)}>
            {about.header.statement}
          </p>
          <Actions actions={about.actions} className="reveal" />
        </div>
      </header>

      <SummitSummary
        id="basecamp-summary"
        heading={about.summary.heading}
        rows={about.summary.rows}
        className="reveal"
        style={reveal(3)}
      />

      <AscentProfile labels={about.ascent} milestones={about.ascent.milestones} stops={stops} />

      <section className={styles.section} aria-labelledby="rope-team-heading">
        <div className={styles.sectionHead} data-quiet-zone>
          <KineticText as="h2" id="rope-team-heading" text={about.principles.heading} className={`${styles.sectionHeading} display`} play="inview" />
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

      <section className={styles.section} aria-labelledby="craft-heading">
        <div className={styles.sectionHead} data-quiet-zone>
          <KineticText as="h2" id="craft-heading" text={about.craft.heading} className={`${styles.sectionHeading} display`} play="inview" />
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

      <section className={`${styles.section} ${styles.offTrail}`} aria-labelledby="off-trail-heading">
        <KineticText as="h2" id="off-trail-heading" text={about.offTrail.heading} className={`${styles.sectionHeading} display`} play="inview" quiet />
        <div className={`${styles.offTrailBody} legend`}>
          <p className="body-copy">{about.offTrail.body}</p>
          <p className={`${styles.flavor} italic`}>{about.offTrail.flavor}</p>
        </div>
      </section>

      <section className={styles.contact} aria-labelledby="contact-heading" data-quiet-zone>
        <KineticText as="h2" id="contact-heading" text={about.contact.heading} className={`${styles.contactHeading} display`} play="inview" proximity />
        <p className="body-copy">{about.contact.body}</p>
        <Actions actions={about.actions} />
      </section>
    </main>
  );
}
