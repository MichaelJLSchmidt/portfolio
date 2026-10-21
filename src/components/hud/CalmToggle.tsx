"use client";

import { setCalmMap, useCalmMap } from "@/lib/motion-preference";
import styles from "./Hud.module.css";

export function CalmToggle({ on, off }: { on: string; off: string }) {
  const calm = useCalmMap();
  return (
    <button
      type="button"
      className={`${styles.toggle} hud-label`}
      aria-pressed={calm}
      onClick={() => setCalmMap(!calm)}
    >
      <span className={styles.switch} aria-hidden="true" />
      {calm ? on : off}
    </button>
  );
}
