"use client";

import { MODES, useMotionMode, type MotionMode } from "@/lib/motion-mode";
import { site } from "@/content/site";
import styles from "./MotionControl.module.css";

/**
 * "Motion: Full · Calm · Off", one compact control in the footer: a native radio group, so arrow
 * keys move between the options and screen readers name the group. The choice is stored and
 * applies at once. While the OS asks for reduced motion, Off is forced: the group says so and the
 * other options are disabled. Off pauses the background and switches haptics off.
 */
export function MotionControl({ className }: { className?: string }) {
  const { mode, forcedStill, setChoice } = useMotionMode();
  const t = site.motion;
  return (
    <fieldset className={className ? `${styles.control} ${className}` : styles.control} aria-describedby={forcedStill ? "motion-forced" : undefined}>
      <legend className={styles.legend}>{t.label}</legend>
      {MODES.map((m: MotionMode) => (
        <label key={m} className={styles.option}>
          <input
            type="radio"
            name="motion"
            value={m}
            checked={mode === m}
            disabled={forcedStill && m !== "still"}
            onChange={() => setChoice(m)}
            className={styles.input}
          />
          <span className={styles.name}>{t.options[m]}</span>
        </label>
      ))}
      {forcedStill && (
        <span id="motion-forced" className="visually-hidden">
          {t.forced}
        </span>
      )}
    </fieldset>
  );
}
