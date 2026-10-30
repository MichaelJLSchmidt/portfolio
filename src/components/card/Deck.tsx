"use client";

import { useLayoutEffect } from "react";
import { cards } from "@/content/cards";
import { flood } from "@/content/flood";
import type { home } from "@/content/home";
import { rememberOrigin, takeOrigin } from "@/components/transition/return-focus";
import { RuledHeading } from "@/components/motion/RuledHeading";
import { SummitCard } from "./SummitCard";
import styles from "./Deck.module.css";

/**
 * Selected work (id="work"): every card from content, each one a link to its case study, in deck
 * order (one column of full-width cards on phones, which snap into place as they scroll, y
 * proximity; two from the small breakpoint, three from the medium one). Each card arrives once
 * per session as it enters (SummitCard). The section's copy arrives as a prop from the server
 * page: importing home.ts here would put the whole home copy into this client component's bundle.
 */
export function Deck({ copy: t }: { copy: typeof home.work }) {
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
  return (
    <section id="work" className={styles.deck} aria-labelledby="work-heading">
      <div className={styles.header} data-quiet-zone>
        <RuledHeading id="work-heading" text={t.heading} className={`${styles.heading} display`} ruleClassName={styles.headRule} flood={flood.sections.work} />
        <p className={`${styles.intro} body-copy`}>{empty ? t.empty : t.intro}</p>
      </div>
      {!empty && (
        <ul className={styles.cards} data-snap="">
          {cards.map((card) => (
            <li key={card.slug} className={styles.slot}>
              <SummitCard card={card} transitionNames onOpen={() => rememberOrigin(card.slug)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
