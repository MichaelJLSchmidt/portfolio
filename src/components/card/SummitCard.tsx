"use client";

import Link from "next/link";
import { Suspense, lazy, useId, useRef, useState, type ReactNode } from "react";
import { cardHref, cardLabels, type SummitCardData } from "@/content/cards";
import { useFinePointer, useIdle } from "@/lib/idle";
import { useReducedMotion } from "@/lib/motion-preference";
import { prefetchTerrain } from "@/components/terrain/field-store";
import { MorphTarget } from "@/components/transition/MorphTarget";
import { morphName } from "@/lib/morph";
import { CardArtwork } from "./CardArtwork";
import { CostBadge, RarityPip, SetSymbol } from "./CardMarks";
import { useGyroStatus } from "./gyro";
import styles from "./SummitCard.module.css";

// Tilt springs (Motion) load after the page is idle on fine pointers, or when gyro tilt is on.
const TiltDriver = lazy(() => import("./TiltDriver"));

export type SummitCardProps = {
  card: SummitCardData;
  /** "deck" caps the width at ~420 px, "inspect" at ~630 px. */
  size?: "deck" | "inspect";
  /** Heading level of the card name within the page outline. */
  headingLevel?: 2 | 3;
  /**
   * Give the artwork and name view-transition names so they morph into the case-study
   * header. Only one element per name may exist on a page, so the deck opts in.
   */
  transitionNames?: boolean;
  /** Called before navigating to the case study (e.g. to remember the origin for focus return). */
  onOpen?: () => void;
  /** The whole card links to its case study (off when already on that page). */
  linkToCaseStudy?: boolean;
};

/**
 * A data-driven trading-card-style project card with spring tilt and contour foil
 * (rarity R and M). The whole card is one link to the case study: a transparent anchor
 * covers the face and takes its accessible name from the card name.
 */
export function SummitCard({
  card,
  size = "deck",
  headingLevel = 3,
  transitionNames = false,
  onOpen,
  linkToCaseStudy = true,
}: SummitCardProps) {
  const [active, setActive] = useState(false);
  const [opening, setOpening] = useState(false);
  const reduced = useReducedMotion();
  const gyro = useGyroStatus();
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const finePointer = useFinePointer();
  const idle = useIdle();
  const tilt = !reduced && ((finePointer && idle) || gyro === "on");
  const nameId = useId();
  const Heading = `h${headingLevel}` as const;
  const foil = card.rarity === "R" || card.rarity === "M";

  const intent = () => prefetchTerrain(card.artwork.terrainId);

  const morph = (part: "art" | "title", node: ReactNode) =>
    transitionNames ? (
      <MorphTarget
        name={morphName(part, card.slug)}
        variant={part}
        className={part === "art" ? styles.artSlot : undefined}
      >
        {node}
      </MorphTarget>
    ) : (
      node
    );

  return (
    <article
      ref={rootRef}
      className={styles.card}
      data-slug={card.slug}
      data-rarity={card.rarity}
      data-size={size}
      data-active={active}
      data-opening={opening}
      data-link={linkToCaseStudy}
      data-shimmer={!reduced && (gyro === "off" || gyro === "resume")}
      aria-labelledby={nameId}
      onPointerEnter={() => {
        setActive(true);
        intent();
      }}
      onFocus={intent}
    >
      <div ref={stageRef} className={styles.stage} onPointerLeave={() => setActive(false)}>
        <div className={styles.tilt}>
          <div className={styles.face}>
            <header className={styles.nameBar}>
              {morph(
                "title",
                <Heading id={nameId} className={styles.name}>
                  {card.name}
                </Heading>,
              )}
              <CostBadge value={card.cost} label={`${cardLabels.costPrefix}: ${card.costLabel}`} />
            </header>
            <p className={styles.coords}>{card.coordinates}</p>
            {morph(
              "art",
              <CardArtwork artwork={card.artwork} alt={card.artworkAlt}>
                {linkToCaseStudy && (
                  <span className={`${styles.openChip} hud-label`} aria-hidden="true">
                    {cardLabels.openLog} →
                  </span>
                )}
              </CardArtwork>,
            )}
            <p className={styles.typeLine}>
              <span>{card.type}</span>
              <SetSymbol symbol={card.set.symbol} label={cardLabels.setSymbol(`${card.set.code} ${card.set.name}`)} />
            </p>
            <div className={styles.rules}>
              <ul className={styles.keywords}>
                {card.keywords.map((k) => (
                  <li key={k.term}>
                    <strong>{k.term}</strong> <em className={styles.reminder}>— {k.reminder}</em>
                  </li>
                ))}
              </ul>
              <hr className={styles.hairline} />
              <p className={`${styles.flavor} italic`}>{card.flavor}</p>
            </div>
            <dl className={styles.stats} aria-label={cardLabels.stats}>
              {card.stats.map((s) => (
                <div key={s.label} className={styles.stat}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.collector} aria-label={cardLabels.collector}>
              <span>{card.set.code}</span>
              <span aria-hidden="true">·</span>
              <span>{card.collector.number}</span>
              <span aria-hidden="true">·</span>
              <RarityPip rarity={card.rarity} label={cardLabels.rarity(card.rarity)} />
              <span aria-hidden="true">·</span>
              <span>{card.collector.language}</span>
            </p>
            {foil && <div className={styles.foil} aria-hidden="true" />}
            <div className={styles.glare} aria-hidden="true" />
            {linkToCaseStudy && (
              <Link
                href={cardHref(card)}
                className={styles.cardLink}
                aria-labelledby={nameId}
                onClick={() => {
                  // Hide hover-only chrome before the view transition snapshots the card.
                  setOpening(true);
                  onOpen?.();
                }}
              />
            )}
          </div>
        </div>
      </div>
      {tilt && (
        <Suspense fallback={null}>
          <TiltDriver rootRef={rootRef} stageRef={stageRef} gyro={gyro} />
        </Suspense>
      )}
    </article>
  );
}
