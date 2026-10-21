"use client";

import { useEffect, useRef, useState } from "react";
import { cards } from "@/content/cards";
import { site } from "@/content/site";
import { rememberOrigin, takeOrigin } from "@/components/transition/return-focus";
import { KineticText } from "@/components/type/KineticText";
import { SummitCard } from "./SummitCard";
import { TiltControl } from "./TiltControl";
import styles from "./Deck.module.css";

/** The home-page deck: every card from content, each one a link to its case study. */
const DEALT_KEY = "summit:deck-dealt";

export function Deck() {
  const listRef = useRef<HTMLUListElement>(null);
  const [deal, setDeal] = useState<"none" | "pending" | "dealt">("none");

  // Coming back from a case study: return focus to the card that opened it (no deal-in).
  useEffect(() => {
    const slug = takeOrigin();
    if (slug) {
      const link = document.querySelector<HTMLAnchorElement>(`article[data-slug="${CSS.escape(slug)}"] a`);
      link?.focus({ preventScroll: false });
      return;
    }
    // First visit this session: deal the cards in when the deck scrolls into view.
    const list = listRef.current;
    // Read the resolved attribute: the hook still reports its SSR snapshot during this effect.
    if (!list || document.documentElement.getAttribute("data-motion") === "reduced") return;
    let dealt = false;
    try {
      dealt = sessionStorage.getItem(DEALT_KEY) === "1";
    } catch {
      dealt = true;
    }
    if (dealt || list.getBoundingClientRect().top < window.innerHeight) return;
    setDeal("pending");
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setDeal("dealt");
        try {
          sessionStorage.setItem(DEALT_KEY, "1");
        } catch {
          // Ignore: the deck simply deals again next time.
        }
      },
      { rootMargin: "0px 0px -18% 0px" },
    );
    io.observe(list);
    return () => io.disconnect();
  }, []);

  return (
    <section className={styles.deck} aria-labelledby="deck-heading">
      <div className={styles.header}>
        <KineticText as="h2" id="deck-heading" text={site.hero.deckHeading} className={`${styles.heading} display`} play="inview" proximity />
        <p className={`${styles.intro} map-halo`}>{site.hero.deckIntro}</p>
        <TiltControl labels={{ enable: site.hud.tiltEnable, resume: site.hud.tiltResume, on: site.hud.tiltOn }} />
      </div>
      <ul ref={listRef} className={styles.cards} data-deal={deal}>
        {cards.map((card, i) => (
          <li key={card.slug} className={styles.slot} style={{ "--deal-i": i } as React.CSSProperties}>
            <SummitCard card={card} transitionNames onOpen={() => rememberOrigin(card.slug)} />
            <p className={`${styles.summary} map-halo`}>{card.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
