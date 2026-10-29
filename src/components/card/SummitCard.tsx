"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, lazy, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cardHref, cardLabels, cardStats, coordinatesLine, type SummitCardData } from "@/content/cards";
import { withValues } from "@/lib/content";
import { useFinePointer, useIdle } from "@/lib/idle";
import { useMotionMode } from "@/lib/motion-mode";
import { prefetchTerrain } from "@/components/terrain/field-store";
import { MorphTarget } from "@/components/transition/MorphTarget";
import { morphName } from "@/lib/morph";
import { CardArtwork } from "./CardArtwork";
import { CostBadge, RarityPip, SetSymbol } from "./CardMarks";
import { useGyroStatus } from "./gyro";
import styles from "./SummitCard.module.css";
import type { SettleTilt } from "./TiltDriver";

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
  // Tilt, the pointer glare and the touch shimmer are full-motion effects.
  const { mode } = useMotionMode();
  const full = mode === "full";
  const gyro = useGyroStatus();
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const finePointer = useFinePointer();
  const idle = useIdle();
  const tilt = full && ((finePointer && idle) || gyro === "on");
  const nameId = useId();
  const settleRef = useRef<SettleTilt | null>(null);
  const router = useRouter();
  const Heading = `h${headingLevel}` as const;

  // The deck stays alive (hidden) while a case study is open: when it is hidden, clear the
  // "opening" state so the chip shows again after navigating back.
  useEffect(() => () => setOpening(false), []);
  const foil = card.rarity === "R" || card.rarity === "M";
  const stats = withValues(cardStats(card)).slice(0, 3);

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
      data-shimmer={full && (gyro === "off" || gyro === "resume")}
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
                  {card.example && <span className="visually-hidden"> ({cardLabels.exampleStamp})</span>}
                </Heading>,
              )}
              <CostBadge value={card.cost} label={`${cardLabels.costPrefix}: ${card.costLabel}`} />
            </header>
            <p className={styles.coords}>{coordinatesLine(card)}</p>
            {morph(
              "art",
              <CardArtwork artwork={card.artwork} alt={card.artworkAlt} stamp={card.example ? cardLabels.exampleStamp : undefined}>
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
            {stats.length > 0 && (
              <dl className={styles.stats} aria-label={cardLabels.stats} style={{ "--cells": stats.length } as CSSProperties}>
                {stats.map((s) => (
                  <div key={s.label} className={styles.stat}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className={styles.collector} aria-label={cardLabels.collector}>
              <span>{card.set.code}</span>
              <span aria-hidden="true">·</span>
              <span>{card.collector.number}</span>
              <span aria-hidden="true">·</span>
              <RarityPip rarity={card.rarity} label={cardLabels.rarity(card.rarity)} note={card.rarityNote} />
              <span aria-hidden="true">·</span>
              <span>{card.collector.language}</span>
            </p>
            {foil && <div className={styles.foil} aria-hidden="true" />}
            {/* Drawn on when the card is rebuilt on the way back from its page (data-reassemble). */}
            <svg className={styles.neatline} aria-hidden="true">
              <rect pathLength={1} />
            </svg>
            <div className={styles.glare} aria-hidden="true" />
            {linkToCaseStudy && (
              <Link
                href={cardHref(card)}
                className={styles.cardLink}
                aria-labelledby={nameId}
                onClick={(e) => {
                  // Hide hover-only chrome before the view transition snapshots the card.
                  setOpening(true);
                  onOpen?.();
                  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  // A tilted card springs flat first (≤120 ms), so the morph never starts tilted.
                  const settled = settleRef.current?.();
                  if (!settled) return;
                  e.preventDefault();
                  const href = cardHref(card);
                  settled.then(() => router.push(href));
                }}
              />
            )}
          </div>
        </div>
      </div>
      {tilt && (
        <Suspense fallback={null}>
          <TiltDriver rootRef={rootRef} stageRef={stageRef} settleRef={settleRef} gyro={gyro} />
        </Suspense>
      )}
    </article>
  );
}
