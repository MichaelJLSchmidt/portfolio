"use client";

import { useMotionMode } from "@/lib/motion-mode";
import { disableGyro, enableGyro, useGyroStatus } from "./gyro";
import styles from "./Deck.module.css";

type Labels = { enable: string; resume: string; on: string };

/** Touch-only: gyroscope tilt starts only after this explicit tap. Full motion only (tilt stops in calm). */
export function TiltControl({ labels }: { labels: Labels }) {
  const status = useGyroStatus();
  const { mode } = useMotionMode();
  if (status === "unavailable" || mode !== "full") return null;
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
