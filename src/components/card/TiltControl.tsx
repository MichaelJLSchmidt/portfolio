"use client";

import { useReducedMotion } from "@/lib/motion-preference";
import { disableGyro, enableGyro, useGyroStatus } from "./gyro";
import styles from "./Deck.module.css";

type Labels = { enable: string; resume: string; on: string };

/** Touch-only: gyroscope tilt starts only after this explicit tap. */
export function TiltControl({ labels }: { labels: Labels }) {
  const status = useGyroStatus();
  const reduced = useReducedMotion();
  if (status === "unavailable" || reduced) return null;
  const on = status === "on";
  return (
    <button
      type="button"
      className={`${styles.tilt} hud-label`}
      aria-pressed={on}
      onClick={() => (on ? disableGyro() : enableGyro())}
    >
      {on ? labels.on : status === "resume" ? labels.resume : labels.enable}
    </button>
  );
}
