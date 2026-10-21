"use client";

import Link from "next/link";
import { useId, useRef, useState, type ReactNode } from "react";
import { cardLabels, type SummitCardData } from "@/content/cards";
import { useReducedMotion } from "@/lib/motion-preference";
import { prefetchTerrain } from "@/components/terrain/field-store";
import { CardArtwork } from "./CardArtwork";
import { CostBadge, RarityPip, SetSymbol } from "./CardMarks";
import { useGyroStatus } from "./gyro";
import { useTilt } from "./useTilt";
import styles from "./SummitCard.module.css";

export type SummitCardProps = {
  card: SummitCardData;
  /** "deck" caps the width at ~420 px, "inspect" at ~630 px. */
  size?: "deck" | "inspect";
  /** Heading level of the card name within the page outline. */
  headingLevel?: 2 | 3;
  /**
   * Wraps the elements that morph into the case-study page (artwork, name).
   * Provided by the deck so the card stays free of routing concerns.
   */
  morph?: (part: "art" | "title", visible: boolean, node: ReactNode) => ReactNode;
  /** Called before navigating to the case study (e.g. to remember the origin for focus return). */
  onOpen?: () => void;
};

const identity = (_part: "art" | "title", _visible: boolean, node: ReactNode) => node;

/**
 * A data-driven trading-card-style project card: tilt, contour foil (R and M only) and a
 * 3D flip. The flip control is a real toggle button; the back link is a separate anchor.
 */
export function SummitCard({ card, size = "deck", headingLevel = 3, morph = identity, onOpen }: SummitCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [active, setActive] = useState(false);
  const reduced = useReducedMotion();
  const gyro = useGyroStatus();
  const rootRef = useRef<HTMLElement>(null);
  const { onPointerMove, onPointerLeave } = useTilt(rootRef, { reduced, gyro });
  const nameId = useId();
  const Heading = `h${headingLevel}` as const;
  const foil = card.rarity === "R" || card.rarity === "M";
  const href = `/work/${card.slug}/`;

  const toggle = () => {
    const next = !flipped;
    setFlipped(next);
    setAnnouncement(next ? cardLabels.announceBack(card.name) : cardLabels.announceFront(card.name));
  };

  const intent = () => prefetchTerrain(card.artwork.terrainId);

  return (
    <article
      ref={rootRef}
      className={styles.card}
      data-rarity={card.rarity}
      data-size={size}
      data-flipped={flipped}
      data-active={active}
      data-shimmer={!reduced && gyro === "off"}
      aria-labelledby={nameId}
      onPointerEnter={() => {
        setActive(true);
        intent();
      }}
      onFocus={intent}
    >
      <div
        className={styles.stage}
        onPointerMove={onPointerMove}
        onPointerLeave={() => {
          setActive(false);
          onPointerLeave();
        }}
      >
        <div className={styles.tilt}>
          <button
            type="button"
            className={styles.hit}
            aria-pressed={flipped}
            aria-label={cardLabels.flipToBack(card.name)}
            onClick={toggle}
          />
          <div className={styles.flipper}>
            <div className={`${styles.face} ${styles.front}`} inert={flipped}>
              <header className={styles.nameBar}>
                {morph(
                  "title",
                  !flipped,
                  <Heading id={nameId} className={styles.name}>
                    {card.name}
                  </Heading>,
                )}
                <CostBadge value={card.cost} label={`${cardLabels.costPrefix}: ${card.costLabel}`} />
              </header>
              <p className={styles.coords}>{card.coordinates}</p>
              {morph("art", !flipped, <CardArtwork artwork={card.artwork} alt={card.artworkAlt} />)}
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
            </div>

            <div className={`${styles.face} ${styles.back}`} inert={!flipped}>
              <div className={styles.backArt} aria-hidden="true">
                {morph("art", flipped, <CardArtwork artwork={card.artwork} alt="" />)}
              </div>
              <div className={styles.backBody}>
                {morph(
                  "title",
                  flipped,
                  <p className={styles.backName} aria-hidden="true">
                    {card.name}
                  </p>,
                )}
                <p className={styles.backSummary}>{card.back.summary}</p>
                <Link
                  href={href}
                  className={styles.backLink}
                  onClick={onOpen}
                  aria-label={`${card.back.linkLabel}: ${card.name}`}
                >
                  {card.back.linkLabel} <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className={styles.glare} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </article>
  );
}
