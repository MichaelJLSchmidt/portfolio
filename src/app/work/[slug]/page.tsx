import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
// Primitives first: their CSS is shared by every route, and importing them after the case-study
// blocks makes Turbopack merge those blocks' CSS into the chunk every route loads.
import { WeightTitle } from "@/components/type/WeightTitle";
import { flood } from "@/content/flood";
import { TrailLink } from "@/components/interaction/TrailLink";
import { CardArtwork } from "@/components/card/CardArtwork";
import { EvidenceBadge, EvidenceLegend } from "@/components/case-study/Evidence";
import { AltimeterBar } from "@/components/case-study/AltimeterBar";
import { Descent } from "@/components/case-study/Descent";
import { ElevationProfile } from "@/components/case-study/ElevationProfile";
import { Figure } from "@/components/case-study/Figure";
import { LegendSheet } from "@/components/case-study/LegendSheet";
import { DecisionFork, Stages } from "@/components/case-study/Stages";
import { TrailheadBand } from "@/components/case-study/TrailheadBand";
import { TrailheadSpread } from "@/components/case-study/TrailheadSpread";
import { WaypointTrail } from "@/components/case-study/WaypointTrail";
import { Logbook } from "@/components/logbook/Logbook";
import { MorphTarget } from "@/components/transition/MorphTarget";
import { RememberCard } from "@/components/transition/RememberCard";
import { caseStudies } from "@/content/case-studies";
import { caseStudyLabels as L, cardBySlug, cards, type SummitCardData } from "@/content/cards";
import { altitudeLabel, ascentOf } from "@/content/geo";
import { readingMinutes, type CaseStudy as Study, type Evidence } from "@/lib/case-study";
import { morphName } from "@/lib/morph";
import { titleEm } from "@/lib/title-axes";
import { arrival } from "@/styles/tokens";
import styles from "./page.module.css";

export const dynamicParams = false;

/** The summary sheet unfolds this long after a link navigation commits (the route's arrival). */
const ARRIVE_SUMMARY = arrival.summary;

/**
 * A static export refuses a dynamic route that generates no page, and a live build has no case
 * study until the first real one is written: then the route generates one placeholder (a 404),
 * which scripts/site/build.mjs removes with the rest of out/work/.
 */
const NO_CASE_STUDY = "_none";

/**
 * The case-study template's one display size: its widest current word (measured at the rest cut)
 * fills the title column. Shorter titles keep that size; a longer word scales its own title down
 * (--word-em).
 */
const TITLE_EM = Math.max(...cards.filter((c) => caseStudies[c.slug]).map((c) => titleEm(c.name, { words: true })), 4);

export function generateStaticParams() {
  const slugs = Object.keys(caseStudies).filter((slug) => cardBySlug(slug));
  return (slugs.length ? slugs : [NO_CASE_STUDY]).map((slug) => ({ slug }));
}

const entry = (slug: string) => {
  const study = caseStudies[slug];
  const card = cardBySlug(slug);
  return study && card ? { study, card } : null;
};

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const found = entry((await params).slug);
  if (!found) return {};
  const { card, study } = found;
  const name = study.example ? `${card.name} (${L.example.toLowerCase()})` : card.name;
  return {
    title: `${name} — ${L.caseStudy}`,
    description: study.metaDescription ?? study.lede,
    // Fictional examples are never indexed, in any build.
    robots: study.example ? { index: false, follow: false } : undefined,
  };
}

/** Every evidence kind the page uses, in a fixed order, for the legend. */
function evidenceKinds(study: Study): Evidence[] {
  const used = new Set<Evidence>([...study.summary.outcome.map((o) => o.evidence), ...study.results.rows.map((r) => r.evidence)]);
  return (["measured", "estimated", "qualitative"] as const).filter((k) => used.has(k));
}

const terrainOf = (card: SummitCardData) => (card.artwork.kind === "crop" ? card.artwork.terrainId : null);

/** Timeline spacing: a node's distance to the next follows the real altitude gain, at least 34 px. */
const SPACE = { min: 34, total: 420 };

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const found = entry((await params).slug);
  if (!found) notFound();
  const { card, study } = found;
  const { summary } = study;
  const ascent = ascentOf(terrainOf(card));
  if (!ascent) throw new Error(`Case study "${card.slug}": its card's terrain is not one of the ascents in geo.ts.`);
  const places = ascent.stages;
  // The case studies in deck order: the next and previous loop round; the ridge shows all three.
  const studies = cards.filter((c) => caseStudies[c.slug]);
  const at = studies.indexOf(card);
  const next = studies.length > 1 ? studies[(at + 1) % studies.length] : null;
  const previous = studies.length > 1 ? studies[(at - 1 + studies.length) % studies.length] : null;
  const ridge = studies.flatMap((c) => {
    const a = ascentOf(terrainOf(c));
    return a
      ? [
          {
            slug: c.slug,
            name: a.summit.label,
            altitude: altitudeLabel(a.summit.altitudeM),
            metres: a.summit.altitudeM,
            current: c === card,
          },
        ]
      : [];
  });
  const hero = study.hero ? study.figures?.[study.hero] : undefined;
  const kinds = evidenceKinds(study);
  // The timeline: each stage as far from the next as the climb between them, the results at the summit.
  const heights = [...places.map((p) => p.altitudeM), ascent.summit.altitudeM];
  const gainTotal = heights[heights.length - 1] - heights[0];
  const trail = [
    ...study.stages.map((s, i) => ({
      id: s.id,
      nav: s.nav,
      place: places[i].label,
      detail: `${places[i].label} · ${altitudeLabel(places[i].altitudeM)}`,
      space: Math.round(Math.max(SPACE.min, ((heights[i + 1] - heights[i]) / gainTotal) * SPACE.total)),
    })),
    {
      id: "results",
      nav: L.resultsHeading,
      detail: `${ascent.summit.label} · ${altitudeLabel(ascent.summit.altitudeM)}`,
    },
  ];

  return (
    <main id="main" className={`${styles.main} container`} data-rarity={card.rarity} data-card={card.slug}>
      {/* data-vt-exit: the page's own content, which leaves first on the way back (return-transition.ts). */}
      <RememberCard slug={card.slug} />
      <nav className={styles.crumbs} aria-label={L.back} data-vt-exit>
        {/* No scroll to the top: the deck brings the card back into view itself (Deck). */}
        <TrailLink href="/" scroll={false} arrow="←" arrowAt="start" className={`${styles.crumb} hud-label map-halo`} data-quiet-zone>
          {L.back}
        </TrailLink>
      </nav>

      <TrailheadSpread
        example={study.example ? L.exampleLine : undefined}
        artwork={
          <MorphTarget name={morphName("art", card.slug)} variant="art" className={styles.artSlot}>
            <CardArtwork artwork={card.artwork} alt={card.artworkAlt} className={styles.art} stamp={card.example ? L.example : undefined} />
          </MorphTarget>
        }
        title={
          <MorphTarget name={morphName("title", card.slug)} variant="title">
            <WeightTitle
              as="h1"
              text={card.name}
              flood={flood.caseStudyTitle}
              className={styles.title}
              style={
                {
                  "--title-em": TITLE_EM,
                  "--word-em": titleEm(card.name, { words: true }),
                } as CSSProperties
              }
            />
          </MorphTarget>
        }
        typeLine={study.typeLine ?? card.type}
        problem={study.problem}
        impactLine={study.impactLine}
        climb={{
          from: {
            label: places[0].label,
            altitude: altitudeLabel(places[0].altitudeM),
          },
          to: {
            label: ascent.summit.label,
            altitude: altitudeLabel(ascent.summit.altitudeM),
          },
          gain: `+${altitudeLabel(gainTotal)}`,
        }}
        facts={[
          { label: L.facts.role, value: study.facts.role },
          { label: L.facts.team, value: study.facts.team },
          { label: L.facts.time, value: study.facts.time },
        ]}
        meta={
          <p className={`${styles.meta} hud-label map-halo`} data-vt-exit>
            <span>{L.readingTime(readingMinutes(study))}</span>
            {" · "}
            <TrailLink href="#summary-heading" variant="inline" className={styles.skim}>
              {L.skim}
            </TrailLink>
          </p>
        }
        labels={{
          problem: L.problem,
          result: L.result,
          gain: L.gain(places[0].label),
        }}
      />

      <LegendSheet
        id="summary-heading"
        heading={L.summaryHeading}
        sheet={L.sheet(at + 1, studies.length)}
        scale={L.scale}
        arriveAt={ARRIVE_SUMMARY}
        note={summary.note}
        rows={[
          { symbol: "brief", label: L.brief, value: summary.brief },
          {
            symbol: "outcome",
            label: L.outcome,
            content: (
              <ul>
                {summary.outcome.map((o) => (
                  <li key={o.text}>
                    <span>{o.text}</span> <EvidenceBadge kind={o.evidence} />
                  </li>
                ))}
              </ul>
            ),
          },
          { symbol: "role", label: L.role, value: summary.role },
          { symbol: "team", label: L.teamLed, value: summary.teamLed },
          {
            symbol: "putInPlace",
            label: L.putInPlace,
            content: (
              <ul>
                {summary.putInPlace.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ),
          },
          {
            symbol: "keyDecision",
            label: L.keyDecision,
            value: summary.keyDecision,
          },
        ]}
      />

      {hero && (
        <div className={styles.hero} data-vt-exit>
          <Figure spec={hero} images={study.images ?? {}} assets={study.assets ?? {}} />
        </div>
      )}

      <div className={styles.body} data-vt-exit>
        <nav className={styles.jump} aria-labelledby="jump-heading">
          <h2 id="jump-heading" className={`${styles.jumpHeading} hud-label map-halo`} data-quiet-zone>
            {L.jumpTo}
          </h2>
          <ul>
            {trail.map((w) => (
              <li key={w.id}>
                <TrailLink href={`#${w.id}`} variant="inline" className={styles.chip}>
                  {w.nav}
                </TrailLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.trail}>
          <WaypointTrail slug={card.slug} label={L.onThisPage} items={trail} />
        </div>
        <div className={styles.stages}>
          <Stages study={study} places={places} />

          <section className={styles.section} aria-labelledby="reversed-heading">
            <h2 id="reversed-heading" className={`${styles.sectionHeading} display`}>
              {L.reversedHeading}
            </h2>
            <DecisionFork decision={study.reversedDecision} heading={study.reversedDecision.title} />
          </section>

          <section className={styles.section} aria-labelledby="after-launch-heading">
            <h2 id="after-launch-heading" className={`${styles.sectionHeading} display`}>
              {L.afterLaunchHeading}
            </h2>
            <Logbook caption={study.afterLaunch.caption} columns={L.logColumns} rows={study.afterLaunch.entries.map((e) => [e.date, e.text])} />
          </section>

          <section id="results" className={styles.section} aria-labelledby="results-heading" data-waypoint>
            <h2 id="results-heading" className={styles.resultsHeading}>
              <span className={`${styles.stageLine} hud-label`}>{`${ascent.summit.label} · ${altitudeLabel(ascent.summit.altitudeM)}`}</span>
              <span className={`${styles.sectionHeading} display`}>{L.resultsHeading}</span>
            </h2>
            <ElevationProfile
              caption={study.results.caption}
              stages={places.map((p) => ({
                label: p.label,
                altitude: altitudeLabel(p.altitudeM),
                metres: p.altitudeM,
              }))}
              summit={{
                label: ascent.summit.label,
                altitude: altitudeLabel(ascent.summit.altitudeM),
                metres: ascent.summit.altitudeM,
              }}
              rows={study.results.rows.map((r) => ({
                metric: r.metric,
                before: r.before,
                after: r.after,
                stage: r.stage,
                badge: <EvidenceBadge kind={r.evidence} />,
              }))}
              labels={{ ...L.resultColumns, stage: L.stage }}
            />
            <EvidenceLegend kinds={kinds} notes={study.results.legend} />
          </section>
        </div>
      </div>

      <Descent lookingBack={{ heading: L.lookingBack, lessons: study.lookingBack }} team={{ heading: L.team, roles: study.team }} />
      <div className={`${styles.closing} legend`} data-vt-exit>
        <p className="body-copy">
          <strong>{L.didNotDo}: </strong>
          {study.didNotDo}
        </p>
        <p className={`${styles.credits} body-copy`}>{study.credits}</p>
      </div>

      <TrailheadBand
        next={next}
        previous={previous}
        ridge={ridge}
        labels={{
          nav: L.next,
          next: L.next,
          previous: L.previous,
          backToAll: L.backToAll,
          youAreHere: L.youAreHere,
          ridge: L.ridge,
        }}
      />
      <AltimeterBar slug={card.slug} items={trail} labels={{ bar: L.onThisPage, sheet: L.jumpTo, close: L.close }} />
    </main>
  );
}
