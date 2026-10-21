"use client";

import { useEffect } from "react";
import { cards, cardLabels } from "@/content/cards";
import { site } from "@/content/site";
import { MagneticLink } from "@/components/transition/MagneticLink";
import { rememberOrigin, takeOrigin } from "@/components/transition/return-focus";
import { SummitCard } from "./SummitCard";
import { TiltControl } from "./TiltControl";
import styles from "./Deck.module.css";

/** The home-page deck: every card from content, plus a one-click link on desktop. */
export function Deck() {
  // Coming back from a case study: return focus to the card that opened it.
  useEffect(() => {
    const slug = takeOrigin();
    if (!slug) return;
    const button = document.querySelector<HTMLButtonElement>(`article[data-slug="${CSS.escape(slug)}"] button[aria-pressed]`);
    button?.focus({ preventScroll: false });
  }, []);

  return (
    <section className={styles.deck} aria-labelledby="deck-heading">
      <div className={styles.header}>
        <h2 id="deck-heading" className={`${styles.heading} display`}>
          {site.hero.deckHeading}
        </h2>
        <p className={`${styles.intro} map-halo`}>{site.hero.deckIntro}</p>
        <TiltControl labels={{ enable: site.hud.tiltEnable, resume: site.hud.tiltResume, on: site.hud.tiltOn }} />
      </div>
      <ul className={styles.cards}>
        {cards.map((card) => (
          <li key={card.slug} className={styles.slot}>
            <SummitCard card={card} transitionNames onOpen={() => rememberOrigin(card.slug)} />
            <MagneticLink
              href={`/work/${card.slug}/`}
              className={`${styles.open} hud-label`}
              onClick={() => rememberOrigin(card.slug)}
            >
              {cardLabels.openLog}
              <span className="visually-hidden">: {card.name}</span> <span aria-hidden="true">→</span>
            </MagneticLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
