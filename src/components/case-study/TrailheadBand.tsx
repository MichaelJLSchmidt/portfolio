"use client";

import { useRouter } from "next/navigation";
import { useRef, type CSSProperties, type MouseEvent } from "react";
import { SummitCard } from "@/components/card/SummitCard";
import { TrailLink } from "@/components/interaction/TrailLink";
import { nameOnCommit } from "@/components/transition/commit-morph";
import { transitionTo } from "@/components/transition/route-transition";
import { cardHref } from "@/content/card-labels";
import type { SummitCardData } from "@/content/cards";
import { haptic } from "@/lib/haptics";
import styles from "./CaseStudy.module.css";

/** A peak on the band's ridge: one project, at its real summit height. */
export type RidgePeak = {
  slug: string;
  name: string;
  altitude: string;
  metres: number;
  current: boolean;
};

/**
 * The trailhead band at the end of a case study: a mini ridge of the three projects' peaks in
 * panorama order with "You are here" on this one, "Next project" with the next card's name as a
 * trail link in display type and its mini card beside it, the way back to all projects below,
 * and on phones two large targets, "Previous project" and "Next project".
 * Committing to the next case study (either link, with the commit haptic) morphs the mini card's
 * artwork and name into that page's header and H1 (commit-morph.ts) inside a view transition of
 * the band's own (React animates no change between two case studies, route-transition.ts). The
 * mini card repeats the link, so it is hidden from screen readers and the tab order.
 */
export function TrailheadBand({
  next,
  previous,
  ridge,
  labels,
}: {
  next: SummitCardData | null;
  previous: SummitCardData | null;
  ridge: readonly RidgePeak[];
  labels: {
    nav: string;
    next: string;
    previous: string;
    backToAll: string;
    youAreHere: string;
    ridge: string;
  };
}) {
  const ref = useRef<HTMLElement>(null);
  const router = useRouter();
  const go = (href: string) => {
    nameOnCommit(ref.current);
    transitionTo(() => router.push(href));
  };
  const commit = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    haptic("commit");
    go(cardHref(next!));
  };
  const min = Math.min(...ridge.map((p) => p.metres)) - 250;
  const max = Math.max(...ridge.map((p) => p.metres));
  return (
    <nav ref={ref} className={styles.trailhead} aria-label={labels.nav} data-vt-exit>
      {ridge.length > 1 && (
        <figure className={styles.ridge}>
          <svg className={styles.ridgeLine} viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true">
            <path
              d={`M0 60${ridge
                .map((p, i) => {
                  const x = 50 + i * 100;
                  const y = 56 - ((p.metres - min) / (max - min)) * 48;
                  return `L${x - 30} ${y + 18}L${x} ${y}L${x + 30} ${y + 18}`;
                })
                .join("")}L300 60`}
            />
          </svg>
          <figcaption className="visually-hidden">{labels.ridge}</figcaption>
          <ol className={styles.peaks}>
            {ridge.map((p, i) => (
              <li key={p.slug} style={{ "--x": `${(50 + i * 100) / 3}%` } as CSSProperties} data-current={p.current || undefined}>
                <span className="hud-label">
                  {p.name} · {p.altitude}
                </span>
                {p.current && <span className={`${styles.here} hud-label`}>{labels.youAreHere}</span>}
              </li>
            ))}
          </ol>
        </figure>
      )}
      {next && (
        <div className={styles.trailheadNext} data-quiet-zone>
          <div className={styles.nextLink}>
            <span className="hud-label" id="next-project-label">
              {labels.next}
            </span>
            <TrailLink href={cardHref(next)} className={`${styles.nextName} display`} aria-describedby="next-project-label" onClick={commit}>
              {next.name}
            </TrailLink>
          </div>
          <div className={styles.trailheadCard} data-reveal="card">
            <SummitCard card={next} size="mini" transitionNames="commit" decorative navigate={go} />
          </div>
        </div>
      )}
      <TrailLink href="/" scroll={false} arrow="←" arrowAt="start" className={`${styles.backToAll} hud-label map-halo`} data-quiet-zone>
        {labels.backToAll}
      </TrailLink>
      {/* Phones: the page ends in two large targets. */}
      <p className={styles.pager}>
        {previous && (
          <TrailLink href={cardHref(previous)} arrow="←" arrowAt="start" className={styles.pagerLink} aria-label={`${labels.previous}: ${previous.name}`}>
            {labels.previous}
          </TrailLink>
        )}
        {next && (
          <TrailLink href={cardHref(next)} className={styles.pagerLink} aria-label={`${labels.next}: ${next.name}`} onClick={commit}>
            {labels.next}
          </TrailLink>
        )}
      </p>
    </nav>
  );
}
