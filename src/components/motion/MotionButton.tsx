"use client";

import { useState, type ButtonHTMLAttributes, type KeyboardEvent, type PointerEvent } from "react";
import { haptic } from "@/lib/haptics";
import styles from "./MotionButton.module.css";

export type MotionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** The button's text: its accessible name and the label that breathes. */
  label: string;
  /**
   * Every label the button can show (e.g. "Copy address" and "COPIED"): the box is reserved at the
   * widest, and a change of label settles the new one in from the label's reveal width.
   */
  labels?: string[];
  /** The press haptic (off when the action ticks its own, e.g. a success). */
  pressHaptic?: boolean;
};

/**
 * A button with the motion language's responses: the label breathes wider on hover (fine
 * pointers) and keyboard focus, a press scales it to --scale-press on the press spring, and a press
 * ticks the haptics where supported. The label's box is reserved at its breath axes, so nothing
 * moves around it. Still mode keeps the colour change only.
 */
export function MotionButton({ label, labels, pressHaptic = true, className, onPointerDown, onKeyDown, type = "button", ...props }: MotionButtonProps) {
  // The label it was first rendered with; a later one settles in.
  const [first] = useState(label);
  return (
    <button
      {...props}
      type={type}
      className={className ? `${styles.button} ${className}` : styles.button}
      onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
        onPointerDown?.(e);
        if (e.button === 0 && pressHaptic) haptic("press");
      }}
      onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(e);
        if (!e.repeat && pressHaptic && (e.key === "Enter" || e.key === " ")) haptic("press");
      }}
    >
      <span className={styles.label}>
        {(labels ?? [label]).map((l) => (
          <span key={l} className={styles.ghost} aria-hidden="true">
            {l}
          </span>
        ))}
        <span key={label} className={styles.run} data-settle={label !== first ? "" : undefined}>
          {label}
        </span>
      </span>
    </button>
  );
}
