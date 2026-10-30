"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, lazy, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { COST_SCALE, cardHref, cardLabels, cardStats, coordinatesLine, type SummitCardData } from "@/content/cards";
import { withValues } from "@/lib/content";
import { haptic } from "@/lib/haptics";
import { useFinePointer, useIdle } from "@/lib/idle";
import { currentMode, useMotionMode } from "@/lib/motion-mode";
import { isSettled, markSettled, settleKey } from "@/lib/settled";
import { useVisited } from "@/lib/visited";
import { Glint } from "@/components/motion/Glint";
import { playGlint } from "@/components/motion/glint";
import { prefetchTerrain } from "@/components/terrain/field-store";
import { MorphTarget } from "@/components/transition/MorphTarget";
import { cardTerrain } from "@/lib/card-terrain";
import { asset } from "@/lib/asset";
import { morphName } from "@/lib/morph";
import { distance, duration, stagger } from "@/styles/tokens";
import { CardArtwork } from "./CardArtwork";
import { RarityPip, ScopePips, SetSymbol } from "./CardMarks";
import styles from "./SummitCard.module.css";
import type { SettleTilt } from "./TiltDriver";

// Tilt springs (Motion) load after the page is idle, under a fine pointer, in full motion.
const TiltDriver = lazy(() => import("./TiltDriver"));

export type SummitCardProps = {
  card: SummitCardData;
  /** "deck" caps the width at ~420 px; "mini" is the trailhead band's 60% card (tilt ≤ 3°). */
  size?: "deck" | "mini";
  /** Heading level of the card name within the page outline. */
  headingLevel?: 2 | 3;
  /**
   * Give the artwork and name view-transition names so they morph into the case-study
   * header. Only one element per name may exist on a page. "commit": named only for the
   * navigation the reader commits to (the trailhead band's next card, commit-morph.ts), so the
   * deck's card of the same name never pairs with it.
   */
  transitionNames?: boolean | "commit";
  /** A second way to a page that a visible link already leads to: hidden from screen readers and out of the tab order. */
  decorative?: boolean;
  /** Called before navigating to the case study (e.g. to remember the origin for focus return). */
  onOpen?: () => void;
  /** Takes the navigation over (the trailhead band runs it inside a view transition of its own). */
  navigate?: (href: string) => void;
};

/** Set once every card has arrived: later visits this session show the deck at once. */
const DEALT_KEY = "summit:deck-dealt";
const dealt = () => {
  try {
    return sessionStorage.getItem(DEALT_KEY) === "1";
  } catch {
    return false;
  }
};
function markDealt() {
  try {
    sessionStorage.setItem(DEALT_KEY, "1");
  } catch {
    // Without storage the cards simply arrive again.
  }
}

// Cards that arrive together (one observer round) deal one after another.
let deal = { at: -Infinity, n: 0 };
function dealPlace(): number {
  const now = performance.now();
  if (now - deal.at > 60) deal = { at: now, n: 0 };
  return deal.n++;
}

/** Resolves once the current frame has painted (a frame, then a task). */
const afterPaint = () => new Promise<void>((done) => requestAnimationFrame(() => window.setTimeout(done, 0)));

/**
 * A Summit Card: a data-driven trading-card-style project card. The whole card is one link to
 * its case study, named "Open case study: <name>, <type>, rarity <letter>" (", Visited" once its
 * case study has been opened).
 *
 * Motion (docs/motion.md): it arrives once per session as it enters (full: rises 12 px and fades
 * with the card stagger; the scope pips fill and the rarity shape traces itself; a Mythic card's
 * foil sweeps once across its name). Hover or focus lifts it −6 px on the card spring with a
 * deeper shadow and a brighter border, the artwork's contours shift by one interval and the foil
 * shows (rarity R and M). A fine pointer tilts it (≤ 5°). Press scales it to 0.98; opening ticks
 * the open haptic. Text and numbers never move. Calm keeps the responses, still only colour and
 * opacity.
 */
export function SummitCard({ card, size = "deck", headingLevel = 3, transitionNames = false, decorative = false, onOpen, navigate }: SummitCardProps) {
  const [active, setActive] = useState(false);
  const { mode } = useMotionMode();
  const full = mode === "full";
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const goldRef = useRef<HTMLSpanElement>(null);
  const finePointer = useFinePointer();
  const idle = useIdle();
  const tilt = full && finePointer && idle;
  const nameId = useId();
  const settleRef = useRef<SettleTilt | null>(null);
  const router = useRouter();
  const visited = useVisited(card.slug);
  const Heading = `h${headingLevel}` as const;
  const terrain = cardTerrain(card.artwork.terrainId);
  const summit = terrain?.pins?.at(-1);

  // Opening is a DOM attribute, not state: the tap re-renders nothing before its press state
  // paints. The deck stays alive (hidden) while a case study is open: the attribute is cleared when
  // the card is hidden, so the chip shows again after navigating back.
  useEffect(() => {
    const el = rootRef.current;
    return () => el?.removeAttribute("data-opening");
  }, []);

  // Arrival, once per session per card: as it enters the screen (data-arrive). Cards already on
  // screen are simply there.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const key = settleKey("deck", `arrive:${card.slug}`);
    // DEALT_KEY: the deck has dealt this session (also how tests and recordings skip the deal).
    // The trailhead band's mini card is simply there (its band reveals).
    if (size === "mini" || isSettled(key) || dealt() || currentMode() === "still") return el.setAttribute("data-arrive", "done");
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      markSettled(key);
      return el.setAttribute("data-arrive", "done");
    }
    el.setAttribute("data-arrive", "wait");
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        markSettled(key);
        // The card stagger: cards arriving together deal one after another (capped).
        const delay = Math.min(dealPlace() * stagger.card.step, stagger.card.cap);
        el.style.setProperty("--deal-delay", `${delay}ms`);
        el.setAttribute("data-arrive", "in");
        // The last card in: the deck has dealt for this session.
        if (!document.querySelector('article[data-arrive="wait"]')) markDealt();
        // A Mythic card's foil sweeps once as it arrives: one gold pass across its name.
        if (card.rarity === "M") window.setTimeout(() => playGlint(goldRef.current, { auto: true }), delay + duration.title);
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [card.slug, card.rarity, size]);

  const foil = card.rarity === "R" || card.rarity === "M";
  const stats = withValues(cardStats(card)).slice(0, 3);

  // Hover or focus: pre-warm the terrain.
  const intent = () => prefetchTerrain(card.artwork.terrainId);

  const morph = (part: "art" | "title", node: ReactNode) =>
    transitionNames === "commit" ? (
      <div className={part === "art" ? styles.artSlot : styles.nameSlot} data-commit-morph={morphName(part, card.slug)} data-commit-class={`morph morph-${part}`}>
        {node}
      </div>
    ) : transitionNames ? (
      <MorphTarget name={morphName(part, card.slug)} variant={part} className={part === "art" ? styles.artSlot : undefined}>
        {node}
      </MorphTarget>
    ) : (
      node
    );
  const exampleId = `${nameId}x`;
  const cost = Number(card.cost);

  return (
    <article
      ref={rootRef}
      className={styles.card}
      data-slug={card.slug}
      data-rarity={card.rarity}
      data-size={size}
      data-active={active}
      data-visited={visited || undefined}
      aria-labelledby={card.example ? `${nameId} ${exampleId}` : nameId}
      aria-hidden={decorative || undefined}
      style={
        {
          ...(terrain ? { "--foil-mask": `url("${asset(terrain.svg)}")` } : {}),
          ...(summit ? { "--summit-x": `${(summit.x * 100).toFixed(1)}%`, "--summit-y": `${(summit.y * 100).toFixed(1)}%` } : {}),
        } as CSSProperties
      }
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") setActive(true);
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
                <div className={styles.nameBox}>
                  <Heading id={nameId} className={styles.name}>
                    {card.name}
                  </Heading>
                  {card.rarity === "M" && (
                    <span ref={goldRef} className={styles.goldGlint}>
                      <Glint text={card.name} className={styles.nameGlint} />
                    </span>
                  )}
                </div>,
              )}
              {card.example && (
                <span id={exampleId} className="visually-hidden">
                  ({cardLabels.exampleStamp})
                </span>
              )}
              {Number.isFinite(cost) && <ScopePips value={cost} of={COST_SCALE} label={cardLabels.scope(cost, COST_SCALE)} />}
            </header>
            <p className={styles.coords}>{coordinatesLine(card)}</p>
            {morph(
              "art",
              <CardArtwork artwork={card.artwork} alt={card.artworkAlt} stamp={card.example ? cardLabels.exampleStamp : undefined}>
                <span className={`${styles.openChip} hud-label`} aria-hidden="true">
                  {cardLabels.openLog} →
                </span>
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
                    <strong className={styles.term}>{k.term}</strong>{" "}
                    <em className={styles.reminder}>— {k.reminder}</em>
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
                    <dd>
                      {s.value}
                      {s.note && <small className={styles.statNote}>{s.note}</small>}
                    </dd>
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
            {visited && <span className={`${styles.visited} hud-label`}>{cardLabels.visitedStamp}</span>}
            <Link
              href={cardHref(card)}
              className={styles.cardLink}
              tabIndex={decorative ? -1 : undefined}
              aria-label={`${cardLabels.open(card.name, card.type, card.rarity)}${visited ? `, ${cardLabels.visited}` : ""}`}
              onClick={(e) => {
                // Hide hover-only chrome before the view transition snapshots the card.
                e.currentTarget.closest("article")?.setAttribute("data-opening", "true");
                onOpen?.();
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                haptic("open");
                // A tilted card springs flat first (≤ 120 ms), so the morph never starts tilted.
                const settled = settleRef.current?.();
                const href = cardHref(card);
                e.preventDefault();
                if (navigate) {
                  void (settled ?? Promise.resolve()).then(() => navigate(href));
                  return;
                }
                // Otherwise the press paints first and the route change (a view transition, which
                // holds rendering while it captures the page) starts a frame later.
                void (settled ?? afterPaint()).then(() => router.push(href));
              }}
            />
          </div>
        </div>
      </div>
      {tilt && (
        <Suspense fallback={null}>
          <TiltDriver rootRef={rootRef} stageRef={stageRef} settleRef={settleRef} maxDeg={size === "mini" ? distance.tiltMini : distance.tiltMax} />
        </Suspense>
      )}
    </article>
  );
}
