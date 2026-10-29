"use client";

import { startTransition, useLayoutEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { cardHref, cards, type SummitCardData } from "@/content/cards";
import type { home } from "@/content/home";
import { rememberOrigin, takeOrigin } from "@/components/transition/return-focus";
import { MorphTarget } from "@/components/transition/MorphTarget";
import { MotionButton } from "@/components/motion/MotionButton";
import { RuledHeading } from "@/components/motion/RuledHeading";
import { SettleText } from "@/components/motion/SettleText";
import { SignatureLink } from "@/components/motion/SignatureLink";
import { prefetchTerrain } from "@/components/terrain/field-store";
import { morphName } from "@/lib/morph";
import { currentMode } from "@/lib/motion-mode";
import { duration } from "@/styles/tokens";
import { SummitCard } from "./SummitCard";
import styles from "./Deck.module.css";

type View = "cards" | "index";
const noop = () => () => {};
const VIEW_KEY = "summit:deck-view";

function readView(): View {
  try {
    return sessionStorage.getItem(VIEW_KEY) === "index" ? "index" : "cards";
  } catch {
    return "cards";
  }
}

function rememberView(view: View) {
  try {
    sessionStorage.setItem(VIEW_KEY, view);
  } catch {
    // Without storage the deck opens on the cards next time.
  }
}

/** One row of the Index view: the name breathes and a rule draws on hover or focus; its terrain pre-warms. */
function IndexRow({ card }: { card: SummitCardData }) {
  const line = card.indexLine;
  const warm = () => prefetchTerrain(card.artwork.terrainId);
  return (
    <li className={styles.row} data-index-slug={card.slug}>
      <SignatureLink
        href={cardHref(card)}
        variant="standalone"
        role="display"
        label={card.name}
        className={styles.rowLink}
        labelClassName={`${styles.rowName} display`}
        wrapLabel={(label) => (
          <MorphTarget name={morphName("title", card.slug)} variant="title">
            {label}
          </MorphTarget>
        )}
        after={<span className={styles.rowLine}> — {[line.kind, line.summary, line.time].join(" · ")}</span>}
        onPointerEnter={warm}
        onFocus={warm}
        onClick={() => rememberOrigin(card.slug)}
      />
    </li>
  );
}

/**
 * The home page's deck: every card from content, each one a link to its case study, in two views.
 *
 * - Cards: a flat spread grid in deck order (one column of full-width cards on phones, which
 *   snap into place as they scroll, y proximity; two from the small breakpoint, three from the
 *   medium one). Each card arrives once per session as it enters (SummitCard).
 * - Index: one row per card, its index line.
 *
 * "Cards" · "Index" switches between them with a View Transition: each card's name morphs into
 * its row's name over --dur-medium (360 ms); calm cross-fades; still switches at once. The choice
 * is remembered for the session. The section's copy arrives as a prop from the server page:
 * importing home.ts here would put the whole home copy into this client component's bundle.
 */
export function Deck({ copy: t }: { copy: typeof home.expeditions }) {
  // The session's view (the server renders the cards); a switch here overrides it.
  const stored = useSyncExternalStore(noop, readView, () => "cards" as View);
  const [chosen, setChosen] = useState<View | null>(null);
  const view = chosen ?? stored;

  // Coming back from a card's page: that card (or its row) is in view and focused. A layout
  // effect, so it happens before a view transition captures the deck, which then rebuilds the
  // card where the reader sees it (return-transition.ts).
  useLayoutEffect(() => {
    const slug = takeOrigin();
    if (!slug) return;
    const escaped = CSS.escape(slug);
    const target = document.querySelector<HTMLElement>(`article[data-slug="${escaped}"], [data-index-slug="${escaped}"]`);
    if (!target) return;
    const r = target.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) target.scrollIntoView({ block: "center" });
    target.querySelector("a")?.focus({ preventScroll: true });
  }, []);

  const switchTo = (next: View) => {
    if (next === view) return;
    rememberView(next);
    const mode = currentMode();
    if (mode === "still") return setChosen(next);
    // The press paints first; the switch (a view transition, which holds rendering while it
    // captures the page) starts a frame later.
    requestAnimationFrame(() =>
      window.setTimeout(() => {
        // The view switch's own timing (globals.css): the names morph over 360 ms; calm cross-fades.
        const root = document.documentElement;
        const flag = mode === "calm" ? "view-calm" : "view";
        root.setAttribute("data-vt", flag);
        window.setTimeout(() => root.getAttribute("data-vt") === flag && root.removeAttribute("data-vt"), duration.medium + duration.short);
        startTransition(() => setChosen(next));
      }, 0),
    );
  };

  // No case study in this build (a live build until the first real one is written): the section
  // stays and says so.
  const empty = cards.length === 0;
  return (
    <section id="expeditions" className={styles.deck} aria-labelledby="deck-heading">
      <div className={styles.header} data-quiet-zone>
        <SettleText as="p" text={t.eyebrow} mode="chars" role="mono" trigger="inview" className={`${styles.eyebrow} hud-label map-halo`} />
        <RuledHeading id="deck-heading" text={empty ? t.emptyHeading : t.heading} className={`${styles.heading} display`} ruleClassName={styles.headRule} />
        <p className={`${styles.intro} body-copy`}>{empty ? t.empty : t.intro}</p>
        {!empty && (
          <div className={styles.views} role="group" aria-label={t.views.label}>
            {(["cards", "index"] as const).map((v) => (
              <MotionButton key={v} label={t.views[v]} aria-pressed={view === v} className={styles.viewButton} onClick={() => switchTo(v)} />
            ))}
          </div>
        )}
      </div>
      {!empty && view === "cards" && (
        <ul className={styles.cards} data-snap="">
          {cards.map((card) => (
            <li key={card.slug} className={styles.slot}>
              <SummitCard card={card} transitionNames onOpen={() => rememberOrigin(card.slug)} />
            </li>
          ))}
        </ul>
      )}
      {!empty && view === "index" && (
        <ol className={styles.index} aria-label={t.indexLabel} style={{ "--rows": cards.length } as CSSProperties}>
          {cards.map((card) => (
            <IndexRow key={card.slug} card={card} />
          ))}
        </ol>
      )}
    </section>
  );
}
