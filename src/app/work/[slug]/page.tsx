import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardArtwork } from "@/components/card/CardArtwork";
import { SummitCard } from "@/components/card/SummitCard";
import { SummitSummary } from "@/components/SummitSummary";
import { MagneticLink } from "@/components/transition/MagneticLink";
import { MorphTarget } from "@/components/transition/MorphTarget";
import { RememberCard } from "@/components/transition/RememberCard";
import { KineticText } from "@/components/type/KineticText";
import { morphName } from "@/lib/morph";
import { caseStudyLabels as L, cardHref, caseStudyCards, cards } from "@/content/cards";
import { site } from "@/content/site";
import styles from "./page.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudyCards.map((card) => ({ slug: card.slug }));
}

const caseStudyBySlug = (slug: string) => caseStudyCards.find((c) => c.slug === slug);

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const card = caseStudyBySlug((await params).slug);
  return card ? { title: `${card.name} — Expedition log · ${site.hero.name}`, description: card.caseStudy.lede } : {};
}

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const card = caseStudyBySlug((await params).slug);
  if (!card) notFound();
  const { summary } = card.caseStudy;
  // The next card in the deck, wherever it leads (another case study or the About page).
  const next = cards[(cards.indexOf(card) + 1) % cards.length];

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

      <header className={styles.header}>
        <MorphTarget name={morphName("art", card.slug)} variant="art" className={styles.artSlot}>
          <CardArtwork artwork={card.artwork} alt={card.artworkAlt} className={styles.art} />
        </MorphTarget>
        <div className={styles.titleBlock} data-quiet-zone>
          <p className={`${styles.coords} hud-label map-halo keep-halo reveal`} data-vt-exit>
            {card.coordinates}
          </p>
          <MorphTarget name={morphName("title", card.slug)} variant="title">
            <KineticText as="h1" text={card.name} className={`${styles.title} display`} delay={420} proximity settleOnArrival />
          </MorphTarget>
          <p className={`${styles.type} map-halo reveal`} style={{ "--reveal-i": 1 } as React.CSSProperties} data-vt-exit>
            {card.type}
          </p>
          <p className="body-copy reveal" style={{ "--reveal-i": 2 } as React.CSSProperties} data-vt-exit>
            {card.caseStudy.lede}
          </p>
        </div>
      </header>

      <SummitSummary
        id="summary-heading"
        heading={L.summaryHeading}
        className="reveal"
        style={{ "--reveal-i": 3 } as React.CSSProperties}
        exitOnReturn
        rows={[
          { label: L.problem, value: summary.problem, wide: true },
          { label: L.role, value: summary.role, wide: true },
          { label: L.team, value: summary.team, stat: true },
          { label: L.duration, value: summary.duration, stat: true },
          { label: L.reach, value: summary.reach, stat: true },
          { label: L.keyDecision, value: summary.keyDecision, wide: true },
          { label: L.outcome, value: summary.outcome, wide: true },
        ]}
      />

      <div className={styles.body} data-vt-exit>
      <nav className={styles.jump} aria-labelledby="jump-heading">
        <h2 id="jump-heading" className="hud-label">
          {L.jumpTo}
        </h2>
        <ul>
          {card.caseStudy.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className={styles.chip}>
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.sections}>
        {card.caseStudy.sections.map((s) => (
          <section key={s.id} id={s.id} className={`${styles.section} legend`} aria-labelledby={`${s.id}-heading`}>
            <KineticText as="h2" id={`${s.id}-heading`} text={s.title} className={`${styles.sectionHeading} display`} play="inview" />
            <p className="body-copy">{s.body}</p>
          </section>
        ))}
      </div>
      </div>

      <aside className={styles.inspect} aria-label={card.name} data-vt-exit>
        <SummitCard card={card} size="inspect" headingLevel={2} linkToCaseStudy={false} />
      </aside>

      <nav className={styles.next} aria-label={L.next} data-vt-exit>
        <MagneticLink href={cardHref(next)} className={styles.nextLink}>
          <span className="hud-label">{L.next}</span>
          <span className={styles.nextRow}>
            <KineticText text={next.name} className={`${styles.nextName} display`} play="inview" proximity />
            <span className={`${styles.nextArrow} display`} aria-hidden="true">
              →
            </span>
          </span>
        </MagneticLink>
      </nav>
    </main>
  );
}
