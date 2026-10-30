"use client";

import { useState, type ReactNode } from "react";
import { rarityShapes } from "@/components/card/rarity-shapes";
import { rarity as rarityTokens } from "@/styles/tokens";
import styles from "./BinderPage.module.css";

/** A pocket as the page hands it over: its card's name and kind label, and its line. */
export type PocketView =
  | { kind: "deck" | "trainer" | "workshop"; name: string; label: string; game?: string; line: string }
  | { kind: "empty" };

/** The fronts' drawings (original line drawings: no game's logo, art or card frame). */
const drawings: Record<"deck" | "trainer" | "workshop", ReactNode> = {
  /** A deck box, lid open a crack. */
  deck: <path d="M14 20 32 12 50 20 32 28ZM14 20V44L32 52V28M50 20V44L32 52M14 20 32 12 50 20 32 28M18 18 36 10 50 16" />,
  /** The trainer: head and shoulders in contour rings, like the portrait's stand-in. */
  trainer: (
    <path d="M32 12a8 9.5 0 1 0 0.01 0ZM32 16.5a4.5 5.5 0 1 0 0.01 0ZM14 52c1-9 8-14 18-14s17 5 18 14M21 52c1-5 5-8 11-8s10 3 11 8" />
  ),
  /** A flip chart on its easel. */
  workshop: <path d="M18 12h28v22H18zM32 34v18M24 52l8-18 8 18M23 20h18M23 26h11" />,
};

const mythic = rarityTokens.M;

/**
 * The cards section's binder page: three by three sleeve pockets holding original cards (a deck
 * box for each game, the trainer, the workshop) and empty pockets still waiting. A tap (or Enter)
 * turns a card over to its one line; the lines are also listed as text beside the binder, so the
 * card faces are hidden from screen readers and each pocket is a toggle button named by its card.
 * Full motion turns the page in once as it scrolls into view (data-reveal="turn") and turns a card
 * over (rotateY, --dur-flip); calm cross-fades a card (--dur-flip-calm) and shows the page at
 * rest; still swaps at once.
 */
export function BinderPage({ label, empty, pockets, className }: { label: string; empty: string; pockets: readonly PocketView[]; className?: string }) {
  const [turned, setTurned] = useState<ReadonlySet<number>>(new Set());
  const toggle = (i: number) =>
    setTurned((t) => {
      const next = new Set(t);
      if (!next.delete(i)) next.add(i);
      return next;
    });
  let empties = 0;

  return (
    <div className={className ? `${styles.page} ${className}` : styles.page} data-reveal="turn" role="group" aria-label={label}>
      <ul className={styles.pockets}>
        {pockets.map((p, i) => {
          if (p.kind === "empty") {
            const first = empties++ === 0;
            return (
              <li key={i} className={styles.pocket} data-empty="">
                {first && <span className={`${styles.emptyLabel} hud-label`}>{empty}</span>}
              </li>
            );
          }
          const on = turned.has(i);
          return (
            <li key={i} className={styles.pocket}>
              <button
                type="button"
                className={styles.card}
                data-kind={p.kind}
                data-turned={on ? "" : undefined}
                aria-pressed={on}
                aria-label={p.name}
                onClick={() => toggle(i)}
              >
                <span className={styles.inner} aria-hidden="true">
                  <span className={`${styles.face} ${styles.front}`}>
                    <span className={`${styles.kind} hud-label`}>{p.label}</span>
                    <svg className={styles.drawing} viewBox="0 0 64 64" focusable="false">
                      {drawings[p.kind]}
                    </svg>
                    {p.game && <span className={styles.game}>{p.game}</span>}
                    {p.kind === "trainer" && (
                      <svg className={styles.rarity} viewBox="0 0 12 12" focusable="false">
                        <path d={rarityShapes[mythic.shape]} />
                      </svg>
                    )}
                  </span>
                  <span className={`${styles.face} ${styles.back}`}>
                    <span className={styles.line}>{p.line}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
