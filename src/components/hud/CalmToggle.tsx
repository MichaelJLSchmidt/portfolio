"use client";

import { useId } from "react";
import { haptic } from "@/lib/haptics";
import { useMotionMode } from "@/lib/motion-mode";
import styles from "./Hud.module.css";

type Labels = { label: string; description: string; forced: string };

/**
 * The motion switch: a native checkbox switch (`switch` gives iOS Safari its system switch and
 * tick; role="switch" elsewhere). Its visible label, "Calm map", is its name (WCAG 2.5.3 Label in
 * Name); the description says what it does, "Reduces motion on this site", and when the OS asks
 * for reduced motion also why it shows on and cannot be switched off. The thumb follows
 * html[data-motion], so it is right from first paint.
 */
export function CalmToggle({ labels }: { labels: Labels }) {
  const { calm, forcedStill, setCalm } = useMotionMode();
  const descId = useId();
  // The description sits outside the <label>, so it never becomes part of the name.
  return (
    <>
      <label className={`${styles.toggle} hud-label`}>
        <span className={styles.switch}>
          <input
            type="checkbox"
            role="switch"
            {...{ switch: "" }}
            className={styles.input}
            checked={calm || forcedStill}
            aria-describedby={descId}
            aria-disabled={forcedStill || undefined}
            onChange={(e) => {
              if (forcedStill) return;
              setCalm(e.currentTarget.checked);
              haptic("detent");
            }}
          />
          <span className={styles.thumb} aria-hidden="true" />
        </span>
        <span>{labels.label}</span>
      </label>
      <span id={descId} className="visually-hidden">
        {forcedStill ? `${labels.description}. ${labels.forced}` : labels.description}
      </span>
    </>
  );
}

/** Haptics on or off; rendered only where vibration works (html[data-haptics], Android). */
export function HapticsToggle({ label }: { label: string }) {
  const { haptics, mode, setHaptics } = useMotionMode();
  return (
    <label className={`${styles.toggle} ${styles.haptics} hud-label`} data-on={haptics}>
      <span className={styles.switch}>
        <input
          type="checkbox"
          role="switch"
          {...{ switch: "" }}
          className={styles.input}
          checked={haptics}
          disabled={mode === "still"}
          onChange={(e) => {
            setHaptics(e.currentTarget.checked);
            if (e.currentTarget.checked) haptic("detent");
          }}
        />
        <span className={styles.thumb} aria-hidden="true" />
      </span>
      <span>{label}</span>
    </label>
  );
}
