"use client";

import { useEffect } from "react";
import { cards } from "@/content/cards";
import { site } from "@/content/site";
import { rememberOrigin, takeOrigin } from "@/components/transition/return-focus";
import { KineticText } from "@/components/type/KineticText";
import { SummitCard } from "./SummitCard";
import { TiltControl } from "./TiltControl";
import styles from "./Deck.module.css";

/** The home-page deck: every card from content, each one a link to its case study. */
export function Deck() {
  // Coming back from a case study: return focus to the card that opened it.
  useEffect(() => {
    const slug = takeOrigin();
    if (!slug) return;
    const link = document.querySelector<HTMLAnchorElement>(`article[data-slug="${CSS.escape(slug)}"] a`);
    link?.focus({ preventScroll: false });
  }, []);

  return (
    <section className={styles.deck} aria-labelledby="deck-heading">
      <div className={styles.header}>
        <KineticText as="h2" id="deck-heading" text={site.hero.deckHeading} className={`${styles.heading} display`} play="inview" proximity />
        <p className={`${styles.intro} map-halo`}>{site.hero.deckIntro}</p>
        <TiltControl labels={{ enable: site.hud.tiltEnable, resume: site.hud.tiltResume, on: site.hud.tiltOn }} />
      </div>
      <ul className={styles.cards}>
        {cards.map((card) => (
          <li key={card.slug} className={styles.slot}>
            <SummitCard card={card} transitionNames onOpen={() => rememberOrigin(card.slug)} />
            <p className={`${styles.summary} map-halo`}>{card.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
