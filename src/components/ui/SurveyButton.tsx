"use client";

import type { ButtonHTMLAttributes } from "react";
import { haptic } from "@/lib/haptics";
import styles from "./SurveyButton.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** A primary press ticks the 8 ms haptic (where vibration works, never in Off). */
  primary?: boolean;
  /** The arrow after the label; none for a plain action. */
  arrow?: string | null;
};

/**
 * The survey button: a 1 px text-3 rectangle, square corners, 48 px high (44 px on phones), with a
 * mono label and an arrow. Hover takes the border to the text colour and steps the arrow 3 px up
 * and right over --dur-fast; focus draws the 2 px mint ring; a press scales to 0.985 for
 * --dur-press. Off: colour changes only.
 */
export function SurveyButton({ primary = false, arrow = "→", className, children, onClick, type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={className ? `${styles.button} mono ${className}` : `${styles.button} mono`}
      onClick={(e) => {
        if (primary) haptic("press");
        onClick?.(e);
      }}
      {...rest}
    >
      <span>{children}</span>
      {arrow && (
        <span className={styles.arrow} aria-hidden="true">
          {arrow}
        </span>
      )}
    </button>
  );
}
