import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
// Motion primitives first: their CSS is shared by every route, and importing them after the
// case-study blocks makes Turbopack merge those blocks' CSS into the chunk every route loads.
import { SettleText } from "@/components/motion/SettleText";
import { SignatureLink } from "@/components/motion/SignatureLink";
import { CardArtwork } from "@/components/card/CardArtwork";
import { SummitCard } from "@/components/card/SummitCard";
import { EvidenceBadge } from "@/components/case-study/Evidence";
import { FictionBanner } from "@/components/case-study/FictionBanner";
import { Figure } from "@/components/case-study/Figure";
import { WaypointTrail } from "@/components/case-study/WaypointTrail";
import { Waypoints } from "@/components/case-study/Waypoints";
import { SummitSummary } from "@/components/SummitSummary";
import { MorphTarget } from "@/components/transition/MorphTarget";
import { RememberCard } from "@/components/transition/RememberCard";
import { caseStudies } from "@/content/case-studies";
import { caseStudyLabels as L, cardBySlug, cardHref, cards, coordinatesLine } from "@/content/cards";
import { site } from "@/content/site";
import { readingMinutes, type CaseStudy as Study, type Evidence } from "@/lib/case-study";
import { morphName } from "@/lib/morph";
import { widestEm } from "@/lib/display-width";
import styles from "./page.module.css";

export const dynamicParams = false;

/**
 * A static export refuses a dynamic route that generates no page, and a live build has no case
 * study until the first real one is written: then the route generates one placeholder (a 404),
 * which scripts/site/build.mjs removes with the rest of out/work/.
 */
const NO_CASE_STUDY = "_none";

/**
 * The case-study template's one display size: its widest current word (measured at the display
 * axes) fills the title column. Shorter titles keep that size; a longer word scales its own
 * title down (--word-em).
 */
const TITLE_EM = Math.max(...cards.filter((c) => caseStudies[c.slug]).map((c) => widestEm(c.name)), 4);

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
    title: `${name} — Expedition log · ${site.hero.name}`,
    description: study.metaDescription ?? study.lede,
    // Fictional examples are never indexed, in any build.
    robots: study.example ? { index: false, follow: false } : undefined,
  };
}

/** Every evidence kind the page uses, in a fixed order, for the legend. */
function evidenceKinds(study: Study): Evidence[] {
  const used = new Set<Evidence>();
  if (Array.isArray(study.summary.outcome)) study.summary.outcome.forEach((o) => used.add(o.evidence));
  for (const w of study.waypoints) {
    for (const b of w.blocks) {
      if (b.kind === "metrics") b.items.forEach((m) => used.add(m.evidence));
      if (b.kind === "outcomes") b.rows.forEach((r) => used.add(r.evidence));
    }
  }
  return (["measured", "estimated", "qualitative"] as const).filter((k) => used.has(k));
}

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const found = entry((await params).slug);
  if (!found) notFound();
  const { card, study } = found;
  const { summary } = study;
  // The next case study in deck order, looping back to the first; never another kind of page.
  const studies = cards.filter((c) => caseStudies[c.slug]);
  const next = studies.length > 1 ? studies[(studies.indexOf(card) + 1) % studies.length] : null;
  const hero = study.hero ? study.figures?.[study.hero] : undefined;
  const outcome = summary.outcome;

  return (
    <main id="main" className={`${styles.main} container`} data-rarity={card.rarity} data-card={card.slug}>
      {/* data-vt-exit: the page's own content, which leaves first on the way back (return-transition.ts). */}
      <RememberCard slug={card.slug} />
      <nav className={styles.crumbs} aria-label={L.back} data-vt-exit>
        {/* No scroll to the top: the deck brings the card back into view itself (Deck). */}
        <Link href="/" scroll={false} className="hud-label">
          <span aria-hidden="true">←</span> {L.back}
        </Link>
      </nav>

      {study.banner && <FictionBanner label={study.banner.label} text={study.banner.text} />}

      <header className={styles.header}>
        <MorphTarget name={morphName("art", card.slug)} variant="art" className={styles.artSlot}>
          <CardArtwork artwork={card.artwork} alt={card.artworkAlt} className={styles.art} stamp={card.example ? L.example : undefined} />
        </MorphTarget>
        <div className={styles.titleBlock} data-quiet-zone>
          <p className={`${styles.coords} hud-label map-halo keep-halo`} data-reveal="" data-vt-exit>
            {coordinatesLine(card)}
          </p>
          <MorphTarget name={morphName("title", card.slug)} variant="title">
            <SettleText
              as="h1"
              text={card.name}
              className={`${styles.title} display`}
              style={{ "--title-em": TITLE_EM, "--word-em": widestEm(card.name) } as CSSProperties}
              widths="display"
              shine
              glint
              settleOnArrival
            />
          </MorphTarget>
          <p className={`${styles.type} map-halo`} data-reveal="" data-vt-exit>
            {study.typeLine ?? card.type}
          </p>
          <p className="body-copy" data-vt-exit>
            {study.lede}
          </p>
          <p className={`${styles.meta} hud-label map-halo`} data-reveal="" data-vt-exit>
            {L.readingTime(readingMinutes(study))} · <a href="#summary-heading">{L.skim}</a>
          </p>
        </div>
      </header>

      <SummitSummary
        id="summary-heading"
        heading={L.summaryHeading}
        exitOnReturn
        note={summary.note}
        rows={[
          { label: L.mandate, value: summary.mandate, wide: true },
          { label: L.role, value: summary.role, wide: true },
          { label: L.teamLed, value: summary.teamLed, wide: true },
          summary.putInPlace?.length
            ? {
                label: L.putInPlace,
                wide: true,
                content: (
                  <ul data-marks="">
                    {summary.putInPlace.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ),
              }
            : { label: L.putInPlace },
          { label: L.keyDecision, value: summary.keyDecision, wide: true },
          Array.isArray(outcome)
            ? {
                label: L.outcome,
                wide: true,
                content: (
                  <ul>
                    {outcome.map((o) => (
                      <li key={o.text}>
                        <span>{o.text}</span>
                        <EvidenceBadge kind={o.evidence} />
                      </li>
                    ))}
                  </ul>
                ),
              }
            : { label: L.outcome, value: outcome, wide: true },
        ]}
      />

      {hero && (
        <div className={styles.hero} data-vt-exit>
          <Figure spec={hero} images={study.images ?? {}} assets={study.assets ?? {}} />
        </div>
      )}

      <div className={styles.body} data-vt-exit>
        <nav className={styles.jump} aria-labelledby="jump-heading">
          <h2 id="jump-heading" className="hud-label">
            {L.jumpTo}
          </h2>
          <ul>
            {study.waypoints.map((w) => (
              <li key={w.id}>
                <a href={`#${w.id}`} className={styles.chip}>
                  {w.nav}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.trail}>
          <WaypointTrail label={L.onThisPage} items={study.waypoints.map((w) => ({ id: w.id, nav: w.nav }))} />
        </div>
        <div className={styles.waypoints}>
          <Waypoints study={study} evidence={evidenceKinds(study)} />
        </div>
      </div>

      <aside className={styles.inspect} aria-label={card.name} data-vt-exit>
        <SummitCard card={card} size="inspect" headingLevel={2} linkToCaseStudy={false} />
      </aside>

      <nav className={styles.next} aria-label={L.next} data-vt-exit>
        {next && (
          <SignatureLink
            href={cardHref(next)}
            variant="display"
            className={styles.nextLink}
            before={<span className="hud-label">{L.next}</span>}
            label={next.name}
            labelClassName={`${styles.nextName} display`}
            arrow="→"
          />
        )}
        <Link href="/" scroll={false} className={`${styles.backToAll} hud-label`}>
          <span aria-hidden="true">←</span> {L.backToAll}
        </Link>
      </nav>
    </main>
  );
}
