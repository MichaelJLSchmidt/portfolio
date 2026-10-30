"use client";

import { useState, type CSSProperties } from "react";
import { rarityShapes } from "@/components/card/rarity-shapes";
import { FloodButton } from "@/components/interaction/FloodButton";
import { asset } from "@/lib/asset";
import { rarity as rarityTokens, type Rarity } from "@/styles/tokens";
import styles from "./PortraitCard.module.css";

export type PortraitCardProps = {
  portrait: {
    /** The encoded cut-out (scripts/portrait.mjs writes src/content/portrait.json). */
    image: null | { width: number; height: number; sources: readonly { format: string; width: number; src: string }[] };
    alt: string;
    placeholderLabel: string;
    showFacts: string;
    showPhoto: string;
    rarity: Rarity;
    collector: string;
  };
  facts: { label: string; rows: readonly { label: string; value: string }[] };
  className?: string;
};

/**
 * The stand-in until the photo is supplied: a head and shoulders drawn as contour lines, each
 * shape ringed inwards like a summit (the head about its centre, the shoulders about their base).
 */
const RINGS = [1, 0.78, 0.56, 0.34];
const HEAD = (k: number) => `M${50 - 22 * k} 48a${22 * k} ${27 * k} 0 1 0 ${44 * k} 0a${22 * k} ${27 * k} 0 1 0 ${-44 * k} 0Z`;
const SHOULDERS = (k: number) => `M${50 - 42 * k} 140C${50 - 40 * k} ${140 - 34 * k} ${50 - 22 * k} ${140 - 48 * k} 50 ${140 - 48 * k}S${50 + 40 * k} ${140 - 34 * k} ${50 + 42 * k} 140`;
/** The card's width: about 240 px in the desktop title, at most 340 px on tablets, 70% of a phone. */
const SIZES = "(min-width: 1024px) 240px, (min-width: 640px) 340px, 70vw";

/**
 * The portrait card: the cut-out portrait on a thin Summit Card frame (its rarity shape and
 * letter, collector number), turned over by "Show facts" (or a click on the card) to the facts,
 * and back by "Show photo". Both faces are in the DOM; the one turned away is inert and hidden
 * from screen readers. The button's label says what it will show, so it carries no pressed state.
 * Full motion turns the card over (rotateY, --dur-flip); calm cross-fades (--dur-flip-calm);
 * still swaps at once. Hover and keyboard focus lift it. PortraitCard.module.css has the look.
 */
export function PortraitCard({ portrait, facts, className }: PortraitCardProps) {
  const [facing, setFacing] = useState<"photo" | "facts">("photo");
  const flipped = facing === "facts";
  const flip = () => setFacing(flipped ? "photo" : "facts");
  const r = rarityTokens[portrait.rarity];
  const frame = (
    <p className={`${styles.frame} hud-label`} aria-hidden="true">
      <svg className={styles.rarity} viewBox="0 0 12 12">
        <path d={rarityShapes[r.shape]} />
      </svg>
      <span>{portrait.rarity}</span>
      <span className={styles.collector}>{portrait.collector}</span>
    </p>
  );
  return (
    <div className={className ? `${styles.wrap} ${className}` : styles.wrap}>
      <div
        id="portrait-card"
        className={styles.card}
        data-facing={facing}
        style={{ "--rarity": `var(--color-${r.color.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)})` } as CSSProperties}
        onClick={flip}
      >
        <div className={styles.inner}>
          <figure className={`${styles.face} ${styles.front}`} inert={flipped} aria-hidden={flipped || undefined}>
            {portrait.image ? (
              <picture>
                {["avif", "webp"].map((format) => (
                  <source
                    key={format}
                    type={`image/${format}`}
                    sizes={SIZES}
                    srcSet={portrait.image!.sources
                      .filter((s) => s.format === format)
                      .map((s) => `${asset(s.src)} ${s.width}w`)
                      .join(", ")}
                  />
                ))}
                <img
                  className={styles.photo}
                  src={asset(portrait.image.sources.find((s) => s.format === "webp" && s.width === portrait.image!.width)?.src ?? portrait.image.sources[0].src)}
                  width={portrait.image.width}
                  height={portrait.image.height}
                  alt={portrait.alt}
                  fetchPriority="high"
                />
              </picture>
            ) : (
              <>
                <svg className={styles.placeholder} viewBox="0 0 100 140" aria-hidden="true">
                  {RINGS.map((k) => (
                    <path key={k} d={`${HEAD(k)}${SHOULDERS(k)}`} />
                  ))}
                </svg>
                <figcaption className="visually-hidden">{portrait.placeholderLabel}</figcaption>
              </>
            )}
            {frame}
          </figure>
          <div className={`${styles.face} ${styles.back}`} inert={!flipped} aria-hidden={!flipped || undefined}>
            <p className={`${styles.factsLabel} hud-label`}>{facts.label}</p>
            <dl className={styles.facts}>
              {facts.rows.map((row) => (
                <div key={row.label}>
                  <dt className="hud-label">{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
            {frame}
          </div>
        </div>
      </div>
      <FloodButton
        className={styles.toggle}
        label={flipped ? portrait.showPhoto : portrait.showFacts}
        labels={[portrait.showFacts, portrait.showPhoto]}
        aria-controls="portrait-card"
        onClick={flip}
      />
    </div>
  );
}
