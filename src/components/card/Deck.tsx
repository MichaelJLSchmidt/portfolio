"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cards } from "@/content/cards";
import { site } from "@/content/site";
import { rememberOrigin, takeOrigin } from "@/components/transition/return-focus";
import { SettleText } from "@/components/motion/SettleText";
import { SummitCard } from "./SummitCard";
import { TiltControl } from "./TiltControl";
import styles from "./Deck.module.css";

/** The home-page deck: every card from content, each one a link to its case study. */
const DEALT_KEY = "summit:deck-dealt";

export function Deck() {
  const listRef = useRef<HTMLUListElement>(null);
  const [deal, setDeal] = useState<"none" | "pending" | "dealt">("none");

  // Coming back from a card's page: that card is in view and focused (no deal-in). A layout
  // effect, so it happens before a view transition captures the deck, which then rebuilds the
  // card where the reader sees it (return-transition.ts).
  const returned = useRef(false);
  useLayoutEffect(() => {
    const slug = takeOrigin();
    returned.current = Boolean(slug);
    if (!slug) return;
    const card = document.querySelector<HTMLElement>(`article[data-slug="${CSS.escape(slug)}"]`);
    if (!card) return;
    const r = card.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) card.scrollIntoView({ block: "center" });
    card.querySelector("a")?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (returned.current) return;
    // First visit this session: deal the cards in when the deck scrolls into view.
    const list = listRef.current;
    // Full motion only. Read the resolved attribute: a hook still reports its SSR snapshot here.
    if (!list || document.documentElement.getAttribute("data-motion") !== "full") return;
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

  // No case study in this build (a live build until the first real one is written): the section
  // stays, says so, and offers nothing to tilt or open.
  const empty = cards.length === 0;
  return (
    <section className={styles.deck} aria-labelledby="deck-heading">
      <div className={styles.header}>
        <SettleText as="h2" id="deck-heading" text={site.hero.deckHeading} className={`${styles.heading} display`} trigger="inview" shine />
        <p className={`${styles.intro} body-copy`}>{empty ? site.hero.deckEmpty : site.hero.deckIntro}</p>
        {!empty && <TiltControl labels={{ enable: site.hud.tiltEnable, resume: site.hud.tiltResume, on: site.hud.tiltOn }} />}
      </div>
      {!empty && (
        <ul ref={listRef} className={styles.cards} data-deal={deal}>
          {cards.map((card, i) => (
            <li key={card.slug} className={styles.slot} style={{ "--deal-i": i } as React.CSSProperties}>
              <SummitCard card={card} transitionNames onOpen={() => rememberOrigin(card.slug)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
