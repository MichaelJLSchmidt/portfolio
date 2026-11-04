import type { Metadata } from "next";
import { MapSheetCard } from "@/components/card/MapSheetCard";
import { EarlierProjects } from "@/components/home/EarlierProjects";
import { Title } from "@/components/type/Title";
import { ContourDivider } from "@/components/ui/ContourDivider";
import { cards } from "@/content/cards";
import { caseStudies } from "@/content/case-studies";
import { home } from "@/content/home";
import { site } from "@/content/site";
import styles from "./page.module.css";

export const metadata: Metadata = { description: home.meta.description };

/**
 * Home: the role line, the display name arriving on its weight, one intro sentence, Case studies
 * (three map-sheet cards on the twelve-column grid, the middle one lower) and Earlier projects as a
 * plain list, then a contour divider and the footer. Phones: the same order in one column.
 */
export default function Home() {
  const studies = cards.filter((c) => caseStudies[c.slug]);
  return (
    <main id="main" className={`${styles.main} container`}>
      <section className={`${styles.hero} grid`} aria-labelledby="hero-name" data-quiet-zone>
        <p className={`${styles.role} mono`}>{home.hero.role.join(" · ")}</p>
        <Title id="hero-name" role="display" text={site.hero.name} className={styles.name} />
        <p className={`${styles.intro} body-copy`}>
          {home.intro.text}{" "}
          <a href="/about/" className={styles.more}>
            {home.intro.more}
          </a>
        </p>
      </section>

      <section id="case-studies" className={`${styles.work} section`} aria-labelledby="case-studies-heading">
        <h2 id="case-studies-heading" className="t-h2" data-quiet-zone>
          {home.work.heading}
        </h2>
        {studies.length === 0 ? (
          <p className={`${styles.empty} body-copy`}>{home.work.empty}</p>
        ) : (
          <ol className={`${styles.cards} grid`} data-reveal-group="">
            {studies.map((card, i) => (
              <li key={card.slug} className={styles.slot} data-reveal="">
                <MapSheetCard card={card} outcome={caseStudies[card.slug]!.impactLine} index={i + 1} total={studies.length} />
              </li>
            ))}
          </ol>
        )}
      </section>

      <EarlierProjects copy={home.earlier} className="section" />
      <ContourDivider className={styles.divider} />
    </main>
  );
}
