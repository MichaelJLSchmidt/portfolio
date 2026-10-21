import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardArtwork } from "@/components/card/CardArtwork";
import { SummitCard } from "@/components/card/SummitCard";
import { MagneticLink } from "@/components/transition/MagneticLink";
import { MorphTarget } from "@/components/transition/MorphTarget";
import { morphName } from "@/lib/morph";
import { caseStudyLabels as L, cardBySlug, cards } from "@/content/cards";
import { site } from "@/content/site";
import styles from "./page.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return cards.map((card) => ({ slug: card.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const card = cardBySlug((await params).slug);
  return card ? { title: `${card.name} — Expedition log · ${site.hero.name}`, description: card.caseStudy.lede } : {};
}

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const card = cardBySlug((await params).slug);
  if (!card) notFound();
  const { summary } = card.caseStudy;
  const next = cards[(cards.indexOf(card) + 1) % cards.length];

  return (
    <main id="main" className={styles.main} data-rarity={card.rarity}>
      <nav className={styles.crumbs} aria-label={L.back}>
        <Link href="/" className="hud-label">
          <span aria-hidden="true">←</span> {L.back}
        </Link>
      </nav>

      <header className={styles.header}>
        <MorphTarget name={morphName("art", card.slug)} className={styles.artSlot}>
          <CardArtwork artwork={card.artwork} alt={card.artworkAlt} className={styles.art} />
        </MorphTarget>
        <div className={styles.titleBlock}>
          <p className={`${styles.coords} hud-label map-halo`}>{card.coordinates}</p>
          <MorphTarget name={morphName("title", card.slug)}>
            <h1 className={`${styles.title} display`}>{card.name}</h1>
          </MorphTarget>
          <p className={`${styles.type} map-halo`}>{card.type}</p>
          <p className={`${styles.lede} map-halo`}>{card.caseStudy.lede}</p>
        </div>
      </header>

      <section className={styles.summary} aria-labelledby="summary-heading">
        <h2 id="summary-heading" className={`${styles.summaryHeading} hud-label`}>
          {L.summaryHeading}
        </h2>
        <dl className={styles.summaryGrid}>
          <div className={styles.wide}>
            <dt>{L.problem}</dt>
            <dd>{summary.problem}</dd>
          </div>
          <div className={styles.wide}>
            <dt>{L.role}</dt>
            <dd>{summary.role}</dd>
          </div>
          <div>
            <dt>{L.team}</dt>
            <dd className={styles.stat}>{summary.team}</dd>
          </div>
          <div>
            <dt>{L.duration}</dt>
            <dd className={styles.stat}>{summary.duration}</dd>
          </div>
          <div>
            <dt>{L.reach}</dt>
            <dd className={styles.stat}>{summary.reach}</dd>
          </div>
          <div className={styles.wide}>
            <dt>{L.keyDecision}</dt>
            <dd>{summary.keyDecision}</dd>
          </div>
          <div className={styles.wide}>
            <dt>{L.outcome}</dt>
            <dd>{summary.outcome}</dd>
          </div>
        </dl>
      </section>

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
          <section key={s.id} id={s.id} className={styles.section} aria-labelledby={`${s.id}-heading`}>
            <h2 id={`${s.id}-heading`} className={`${styles.sectionHeading} display`}>
              {s.title}
            </h2>
            <p>{s.body}</p>
          </section>
        ))}
      </div>

      <aside className={styles.inspect} aria-label={card.name}>
        <SummitCard card={card} size="inspect" headingLevel={2} linkToCaseStudy={false} />
      </aside>

      <nav className={styles.next} aria-label={L.next}>
        <MagneticLink href={`/work/${next.slug}/`} className={styles.nextLink}>
          <span className="hud-label">{L.next}</span>
          <span className={`${styles.nextName} display`}>
            {next.name} <span aria-hidden="true">→</span>
          </span>
        </MagneticLink>
      </nav>
    </main>
  );
}
