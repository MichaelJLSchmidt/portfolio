"use client";

import type { ButtonHTMLAttributes, KeyboardEvent, PointerEvent } from "react";
import { haptic } from "@/lib/haptics";
import styles from "./MotionButton.module.css";

export type MotionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** The button's text: its accessible name and the label that breathes. */
  label: string;
};

/**
 * A button with the motion language's responses: the label breathes wider on hover (fine
 * pointers) and keyboard focus, a press scales it to --scale-press on the press spring, and a press
 * ticks the haptics where supported. The label's box is reserved at its breath axes, so nothing
 * moves around it. Still mode keeps the colour change only.
 */
export function MotionButton({ label, className, onPointerDown, onKeyDown, type = "button", ...props }: MotionButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={className ? `${styles.button} ${className}` : styles.button}
      onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
        onPointerDown?.(e);
        if (e.button === 0) haptic("press");
      }}
      onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(e);
        if (!e.repeat && (e.key === "Enter" || e.key === " ")) haptic("press");
      }}
    >
      <span className={styles.label}>
        <span className={styles.ghost} aria-hidden="true">
          {label}
        </span>
        <span className={styles.run}>{label}</span>
      </span>
    </button>
  );
}
