"use client";

import { setCalmMap, useCalmMap } from "@/lib/motion-preference";
import styles from "./Hud.module.css";

/** Switch state is shown by the knob and announced through aria-pressed. */
export function CalmToggle({ label }: { label: string }) {
  const calm = useCalmMap();
  return (
    <button
      type="button"
      className={`${styles.toggle} hud-label`}
      aria-pressed={calm}
      onClick={() => setCalmMap(!calm)}
    >
      <span className={styles.switch} aria-hidden="true" />
      {label}
    </button>
  );
}
