"use client";

import { useId } from "react";
import { haptic } from "@/lib/haptics";
import { useMotionMode } from "@/lib/motion-mode";
import styles from "./Hud.module.css";

type Labels = { on: string; off: string; name: string; forced: string };

/**
 * The motion switch: a native checkbox switch (`switch` gives iOS Safari its system switch and
 * tick; role="switch" elsewhere), named "Reduce motion on this site". The visible state ("Calm
 * map" / "Clear night") and the thumb follow html[data-motion], so they are right from first
 * paint. When the OS asks for reduced motion the switch shows on and its description says why.
 */
export function CalmToggle({ labels }: { labels: Labels }) {
  const { calm, forcedStill, setCalm } = useMotionMode();
  const descId = useId();
  return (
    <label className={`${styles.toggle} hud-label`}>
      <span className={styles.switch}>
        <input
          type="checkbox"
          role="switch"
          {...{ switch: "" }}
          className={styles.input}
          checked={calm || forcedStill}
          aria-label={labels.name}
          aria-describedby={forcedStill ? descId : undefined}
          aria-disabled={forcedStill || undefined}
          onChange={(e) => {
            if (forcedStill) return;
            setCalm(e.currentTarget.checked);
            haptic("detent");
          }}
        />
        <span className={styles.thumb} aria-hidden="true" />
      </span>
      <span className={styles.state} aria-hidden="true">
        <span data-state="on">{labels.on}</span>
        <span data-state="off">{labels.off}</span>
      </span>
      {forcedStill && (
        <span id={descId} className="visually-hidden">
          {labels.forced}
        </span>
      )}
    </label>
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
