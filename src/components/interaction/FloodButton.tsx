"use client";

import type { ButtonHTMLAttributes, KeyboardEvent, PointerEvent } from "react";
import { flood } from "@/content/flood";
import { haptic } from "@/lib/haptics";
import styles from "./FloodButton.module.css";

export type FloodButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** The button's text: its accessible name and its label. */
  label: string;
  /** Every label the button can show (e.g. "Copy address", "Copied"): the box is reserved at the widest. */
  labels?: string[];
  /** The press haptic (off when the action ticks its own, e.g. a success). */
  pressHaptic?: boolean;
};

/**
 * The flood button: at rest a 1.5 px contour outline with the label in the button face; on hover
 * and keyboard focus the glacier flood spreads through it (the contour flood, flood.ts: from where
 * the pointer came in, left to right for the keyboard, from the finger on touch) and the label
 * turns ground; focus adds a 2 px mint ring 3 px out; a press fills it at once, insets 1 px and
 * ticks the press haptic. Its box is reserved at its widest label and never changes width.
 * FloodButton.module.css has the look.
 */
export function FloodButton({ label, labels, pressHaptic = true, className, onPointerDown, onKeyDown, type = "button", ...props }: FloodButtonProps) {
  const all = labels ?? [label];
  // Every label it can show, stacked as echoes (no DOM text), so the box is the widest of them.
  const face = (copy: boolean) => (
    <span className={styles.face} aria-hidden={copy || undefined}>
      {all.map((l) => (
        <span key={l} className={styles.ghost} data-echo={l} aria-hidden="true" />
      ))}
      {copy ? <span className={styles.text} data-echo={label} /> : <span className={styles.text}>{label}</span>}
    </span>
  );
  return (
    <button
      {...props}
      type={type}
      className={className ? `${styles.button} ${className}` : styles.button}
      data-flood={flood.buttons ? "" : undefined}
      onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
        onPointerDown?.(e);
        if (e.button === 0 && pressHaptic) haptic("press");
      }}
      onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(e);
        if (!e.repeat && pressHaptic && (e.key === "Enter" || e.key === " ")) haptic("press");
      }}
    >
      {face(false)}
      <span className={styles.fringe} data-flood-fringe="" aria-hidden="true" />
      <span className={styles.flood} data-flood-layer="" aria-hidden="true">
        {face(true)}
      </span>
    </button>
  );
}
