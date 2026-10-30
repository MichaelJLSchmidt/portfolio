"use client";

import { useLayoutEffect, type CSSProperties } from "react";
import type { SummitCardData } from "@/content/cards";
import { flood } from "@/content/flood";
import type { home } from "@/content/home";
import { rememberOrigin, takeOrigin } from "@/components/transition/return-focus";
import { RuledHeading } from "@/components/motion/RuledHeading";
import { SummitCard } from "./SummitCard";
import styles from "./Deck.module.css";

/** What the server page knows about each card's case study: its caption and its summit (the spot
 * height's label, and its height in metres). */
export type DeckEntry = { problem: string; result: string; role: string; spot: string; metres: number };

/**
 * Selected work (id="work") as a ridge: the cards stand on a drawn ridgeline in deck order (the
 * panorama seen from Interlaken), each raised by its real summit height, with a plain caption
 * under it (problem, result, role). Phones: a vertical stack at 86% width, alternately offset,
 * each card with its spot height beside it. No carousel. Each card arrives once per session as it
 * enters (SummitCard). The cards, the copy and the captions arrive as props from the server page:
 * importing the content here would put it into this client component's bundle.
 */
export function Deck({ copy: t, cards, entries = {} }: { copy: typeof home.work; cards: readonly SummitCardData[]; entries?: Record<string, DeckEntry> }) {
  // Coming back from a card's page: that card is in view and focused. A layout effect, so it
  // happens before a view transition captures the deck, which then rebuilds the card where the
  // reader sees it (return-transition.ts).
  useLayoutEffect(() => {
    const slug = takeOrigin();
    if (!slug) return;
    const target = document.querySelector<HTMLElement>(`article[data-slug="${CSS.escape(slug)}"]`);
    if (!target) return;
    const r = target.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) target.scrollIntoView({ block: "center" });
    target.querySelector("a")?.focus({ preventScroll: true });
  }, []);

  // No case study in this build (a live build until the first real one is written): the section
  // stays and says so.
  const empty = cards.length === 0;
  // Heights: the highest summit stands highest; the others lower by their real difference.
  const heights = cards.map((c) => entries[c.slug]?.metres ?? 0);
  const top = Math.max(...heights, 1);
  const low = Math.min(...heights.filter(Boolean), top);
  return (
    <section id="work" className={styles.deck} aria-labelledby="work-heading">
      <div className={styles.header} data-quiet-zone>
        <RuledHeading id="work-heading" text={t.heading} className={`${styles.heading} display`} ruleClassName={styles.headRule} flood={flood.sections.work} />
        <p className={`${styles.intro} body-copy`}>{empty ? t.empty : t.intro}</p>
      </div>
      {!empty && (
        <div className={styles.ridge}>
          <svg className={styles.ridgeLine} viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true" data-route="ridge" data-route-anchor="ridge">
            <path
              d={`M0 100${cards
                .map((c, i) => {
                  const x = 50 + i * 100;
                  const y = 20 + ((top - (entries[c.slug]?.metres ?? low)) / Math.max(1, top - low)) * 30;
                  return `L${x - 34} ${y + 26}L${x} ${y}L${x + 34} ${y + 26}`;
                })
                .join("")}L300 100`}
            />
          </svg>
          <ul className={styles.cards} data-snap="">
            {cards.map((card, i) => {
              const e = entries[card.slug];
              const drop = e ? (top - e.metres) / Math.max(1, top - low) : 0;
              return (
                <li key={card.slug} className={styles.slot} style={{ "--drop": drop.toFixed(3), "--side": i % 2 ? 1 : -1 } as CSSProperties}>
                  {e && (
                    <p className={`${styles.spot} hud-label map-halo`} data-quiet-zone>
                      {e.spot}
                    </p>
                  )}
                  <SummitCard card={card} transitionNames onOpen={() => rememberOrigin(card.slug)} />
                  {e && (
                    <dl className={styles.caption} data-quiet-zone>
                      <div>
                        <dt className="hud-label map-halo">{t.caption.problem}</dt>
                        <dd>{e.problem}</dd>
                      </div>
                      <div>
                        <dt className="hud-label map-halo">{t.caption.result}</dt>
                        <dd>{e.result}</dd>
                      </div>
                      <div>
                        <dt className="hud-label map-halo">{t.caption.role}</dt>
                        <dd>{e.role}</dd>
                      </div>
                    </dl>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
