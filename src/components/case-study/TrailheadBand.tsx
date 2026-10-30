"use client";

import { useRouter } from "next/navigation";
import { useRef, type MouseEvent } from "react";
import { SummitCard } from "@/components/card/SummitCard";
import { TrailLink } from "@/components/interaction/TrailLink";
import { nameOnCommit } from "@/components/transition/commit-morph";
import { transitionTo } from "@/components/transition/route-transition";
import { cardHref, type SummitCardData } from "@/content/cards";
import { haptic } from "@/lib/haptics";
import styles from "./CaseStudy.module.css";

/**
 * The trailhead band at the end of a case study: "Next project" with the next card's name as a
 * trail link in display type, its mini card beside it, and the way back to all projects below.
 * Committing to the next case study (either link, with the commit haptic) morphs the mini card's
 * artwork and name into that page's header and H1 (commit-morph.ts) inside a view transition of
 * the band's own (React animates no change between two case studies, route-transition.ts). The
 * mini card repeats the link, so it is hidden from screen readers and the tab order.
 */
export function TrailheadBand({
  next,
  labels,
}: {
  next: SummitCardData | null;
  labels: { nav: string; next: string; backToAll: string };
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
  return (
    <nav ref={ref} className={styles.trailhead} aria-label={labels.nav} data-vt-exit>
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
    </nav>
  );
}
