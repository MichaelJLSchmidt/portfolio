"use client";

import { useRouter } from "next/navigation";
import { useRef, type MouseEvent } from "react";
import { SummitCard } from "@/components/card/SummitCard";
import { glintOnArrival } from "@/components/motion/glint";
import { SignatureLink } from "@/components/motion/SignatureLink";
import { nameOnCommit } from "@/components/transition/commit-morph";
import { transitionTo } from "@/components/transition/route-transition";
import { cardHref, type SummitCardData } from "@/content/cards";
import { haptic } from "@/lib/haptics";
import styles from "./CaseStudy.module.css";

/**
 * The trailhead band at the end of a case study: "Next expedition" with the next card's name as a
 * display link, its mini card beside it, and the way back to every expedition below (its arrow
 * nudges back). Committing to the next case study (either link: the press state, the commit
 * haptic) morphs the mini card's artwork and name into that page's header and H1 (commit-morph.ts)
 * inside a view transition of the band's own (React animates no change between two case studies,
 * route-transition.ts), and the H1 glints once it has landed. The mini card repeats the display
 * link, so it is hidden from screen readers and the tab order.
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
    glintOnArrival(e.currentTarget.pathname);
    go(cardHref(next!));
  };
  return (
    <nav ref={ref} className={styles.trailhead} aria-label={labels.nav} data-vt-exit>
      {next && (
        <div className={styles.trailheadNext} data-quiet-zone>
          <SignatureLink
            href={cardHref(next)}
            variant="display"
            className={styles.nextLink}
            before={<span className="hud-label">{labels.next}</span>}
            label={next.name}
            labelClassName={`${styles.nextName} display`}
            arrow="→"
            onClick={commit}
          />
          <div className={styles.trailheadCard} data-reveal="card">
            <SummitCard card={next} size="mini" transitionNames="commit" decorative navigate={go} />
          </div>
        </div>
      )}
      <SignatureLink href="/" scroll={false} variant="standalone" role="mono" label={labels.backToAll} arrow="←" arrowAt="start" className={`${styles.backToAll} hud-label map-halo`} data-quiet-zone />
    </nav>
  );
}
