import type { Metadata } from "next";
import { notFound } from "next/navigation";
// Primitives first: their CSS is shared by every route, and importing them after the case-study
// blocks makes Turbopack merge those blocks' CSS into the chunk every route loads.
import { Title } from "@/components/type/Title";
import { Blocks } from "@/components/case-study/Blocks";
import { Chapter, SubHeading } from "@/components/case-study/Chapter";
import { ContentsTrail } from "@/components/case-study/ContentsTrail";
import { HeaderPlate } from "@/components/case-study/HeaderPlate";
import { ImagePair } from "@/components/case-study/ImagePair";
import { MapFrame } from "@/components/case-study/MapFrame";
import { MetricBand } from "@/components/case-study/MetricBand";
import { NextCase } from "@/components/case-study/NextCase";
import { OptionsBand } from "@/components/case-study/OptionsBand";
import { OutcomeBand } from "@/components/case-study/OutcomeBand";
import { PinnedDecision } from "@/components/case-study/PinnedDecision";
import { Reflection } from "@/components/case-study/Reflection";
import { SummaryBand } from "@/components/case-study/SummaryBand";
import { caseStudies } from "@/content/case-studies";
import { caseStudyLabels as L, cardBySlug, cards } from "@/content/cards";
import { summitOf } from "@/content/geo";
import { asset } from "@/lib/asset";
import { readingMinutes } from "@/lib/case-study";
import { pageNumbers, SECTION_IDS as ID, surveyLayout } from "@/lib/survey-layout";
import styles from "./page.module.css";

export const dynamicParams = false;

/**
 * A static export refuses a dynamic route that generates no page, and a live build has no case
 * study until the first real one is written: then the route generates one placeholder (a 404),
 * which scripts/site/build.mjs removes with the rest of out/work/.
 */
const NO_CASE_STUDY = "_none";

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

/**
 * A case study on the Calm Survey template (src/lib/survey-layout.ts), alternating the dark
 * ground and light sheet bands: the header plate, the summary, chapter 01 (context) beside the
 * contents trail, the metric band, chapter 02 (findings) with an offset image pair, the pinned
 * decision, the options, the hero in a map frame, chapter 03 (leading the team) under its pull
 * statement, the outcome, the reflection and the next case study.
 */
export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const found = entry((await params).slug);
  if (!found) notFound();
  const { card, study } = found;
  const layout = surveyLayout(study, card, L.contents);
  const numbers = pageNumbers(layout);
  const summit = summitOf(card.terrainId);
  // The case studies in card order: the next one loops round.
  const studies = cards.filter((c) => caseStudies[c.slug]);
  const at = studies.indexOf(card);
  const next = studies.length > 1 ? studies[(at + 1) % studies.length] : null;
  const chapter = (n: number, name: string) => L.chapter(n, name);
  const { findings, leading } = layout;

  return (
    <main id="main" className={styles.main} data-card={card.slug}>
      <HeaderPlate
        plate={asset(`/plates/${card.terrainId}-level.svg`)}
        alt={card.artworkAlt}
        slug={card.slug}
        example={study.example ? L.exampleLine : undefined}
        meta={[L.number(at + 1), study.typeLine ?? card.sector, L.readingTime(readingMinutes(study))].join(" · ")}
        title={<Title role="h1" text={card.name} />}
        summit={summit ? [summit.label, summit.altitude, summit.coordinates].filter(Boolean).join(" · ") : null}
      />

      <SummaryBand id={ID.summary} summary={layout.summary} />

      <ContentsTrail entries={layout.contents} label={L.onThisPage} toggle={L.contentsToggle} />

      <Chapter id={ID.context} line={chapter(1, L.contents.context)} heading={layout.context.stage.finding}>
        <div data-block="text" data-reveal="">
          <p className={`${styles.brief} body-copy`}>
            <strong>{`${L.brief}: `}</strong>
            {layout.context.brief}
          </p>
        </div>
        <Blocks blocks={layout.context.stage.blocks} study={study} numbers={numbers} />
      </Chapter>

      {layout.metric && <MetricBand value={layout.metric.value} line={layout.metric.line} />}

      <Chapter id={ID.findings} line={chapter(2, L.contents.findings)} heading={findings.discovery.finding}>
        <Blocks blocks={findings.discovery.blocks} study={study} numbers={numbers} />
      </Chapter>
      {findings.pair && <ImagePair ids={findings.pair} study={study} numbers={numbers.figures} />}
      <section className={`${styles.continued} container grid`} aria-labelledby={`${findings.delivery.id}-heading`}>
        <SubHeading id={`${findings.delivery.id}-heading`}>{findings.delivery.finding}</SubHeading>
        <Blocks blocks={findings.delivery.blocks} study={study} numbers={numbers} />
      </section>

      <PinnedDecision
        id={ID.decisions}
        line={L.contents.decisions}
        finding={layout.decisions.finding}
        steps={layout.decisions.steps}
        after={layout.decisions.after}
        study={study}
        numbers={numbers}
      />

      <OptionsBand decisions={layout.decisions.steps.map((s) => ({ decision: s.decision, number: s.number }))} reversed={layout.options.reversed} />

      {layout.map && <MapFrame id={layout.map} study={study} coordinates={summit?.coordinates ?? null} />}

      <Chapter id={ID.leading} line={chapter(3, L.contents.leading)} heading={leading.pull} pull>
        <Blocks blocks={leading.stage.blocks} study={study} numbers={numbers} />
        <SubHeading>{L.teamLed}</SubHeading>
        <div data-block="text" data-reveal="">
          <p className="body-copy">{leading.teamLed}</p>
        </div>
        <SubHeading>{L.putInPlace}</SubHeading>
        <div data-block="text" data-reveal="">
          <ul className={`${styles.list} body-copy`}>
            {leading.putInPlace.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <SubHeading>{L.team}</SubHeading>
        <div data-block="text" data-reveal="">
          <ul className={`${styles.roster} body-copy`}>
            {leading.team.map((t) => (
              <li key={t.role}>
                <span className="mono">{t.count}</span>
                <span>
                  <strong>{t.role}</strong> {t.line}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Chapter>

      <OutcomeBand id={ID.outcome} line={L.contents.outcome} outcome={layout.outcome} study={study} numbers={numbers} />

      <Reflection id={ID.reflection} line={L.contents.reflection} reflection={layout.reflection} />

      <div className={`${styles.next} container section`} data-breaker="">
        <NextCase
          next={next}
          outcome={next ? caseStudies[next.slug]!.impactLine : ""}
          index={next ? studies.indexOf(next) + 1 : 0}
          total={studies.length}
          labels={{ next: L.next, backToAll: L.backToAll }}
        />
      </div>
    </main>
  );
}
