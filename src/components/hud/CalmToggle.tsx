"use client";

import { useId } from "react";
import { SettleText } from "@/components/motion/SettleText";
import { haptic } from "@/lib/haptics";
import { useMotionMode } from "@/lib/motion-mode";
import styles from "./Hud.module.css";

type Labels = { label: string; description: string; forced: string };

/**
 * The motion switch: a native checkbox switch (`switch` gives iOS Safari its system switch and
 * tick; role="switch" elsewhere). Its visible label, "Calm map", is its name (WCAG 2.5.3 Label in
 * Name); the description says what it does, "Reduces motion on this site", and when the OS asks
 * for reduced motion also why it shows on and cannot be switched off. The thumb follows <html>
 * (data-calm, or the still mode), so it is right from first paint and moves on the thumb spring as
 * soon as it is flipped; the mode itself follows a frame later (setCalmMap). The label
 * settles in mono on first load.
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
              haptic("press");
            }}
          />
          <span className={styles.thumb} aria-hidden="true" />
        </span>
        <SettleText text={labels.label} mode="block" role="mono" id="hud-calm" scope="site" reserve="rest" className={styles.toggleText} />
      </label>
      <span id={descId} className="visually-hidden">
        {forcedStill ? `${labels.description}. ${labels.forced}` : labels.description}
      </span>
    </>
  );
}

/**
 * Haptics on or off; rendered only where vibration works (html[data-haptics], Android): next to
 * Calm map in the HUD from the small breakpoint up, in the footer below it.
 */
export function HapticsToggle({ label, className }: { label: string; className?: string }) {
  const { haptics, mode, setHaptics } = useMotionMode();
  return (
    <label className={`${styles.toggle} ${styles.haptics} hud-label ${className ?? ""}`} data-on={haptics}>
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
            if (e.currentTarget.checked) haptic("press");
          }}
        />
        <span className={styles.thumb} aria-hidden="true" />
      </span>
      <SettleText text={label} mode="block" role="mono" id="hud-haptics" scope="site" reserve="rest" className={styles.toggleText} />
    </label>
  );
}
