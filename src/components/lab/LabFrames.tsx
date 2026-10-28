"use client";

import { useEffect, useRef } from "react";
import { lab } from "@/content/lab";
import { asset } from "@/lib/asset";
import { SETTLED_STORAGE_KEY } from "@/lib/settled";
import type { MotionMode } from "@/lib/motion-mode";
import { MotionButton } from "@/components/motion/MotionButton";
import styles from "./Lab.module.css";

const MODES: MotionMode[] = ["full", "calm", "still"];

/** The three columns: the specimen sheet in each mode, scrolled together; "Replay all" restarts them. */
export function LabFrames() {
  const frames = useRef<(HTMLIFrameElement | null)[]>([]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.lab !== "scroll") return;
      for (const f of frames.current) {
        if (f?.contentWindow && f.contentWindow !== e.source) f.contentWindow.postMessage({ lab: "scrollTo", y: e.data.y }, window.location.origin);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const replay = () => {
    try {
      sessionStorage.removeItem(SETTLED_STORAGE_KEY);
    } catch {
      // Without storage nothing was remembered.
    }
    frames.current.forEach((f) => f?.contentWindow?.location.reload());
  };

  return (
    <>
      <div>
        <MotionButton label={lab.replay} onClick={replay} />
      </div>
      <div className={styles.columns}>
        {MODES.map((mode, i) => (
          <section key={mode} className={styles.column} aria-labelledby={`lab-${mode}`}>
            <header className={styles.columnHead}>
              <h2 id={`lab-${mode}`} className="hud-label">
                {lab.modes[mode].name}
              </h2>
              <p className={styles.columnNote}>{lab.modes[mode].note}</p>
            </header>
            <iframe
              ref={(el) => {
                frames.current[i] = el;
              }}
              className={styles.frame}
              src={asset(`/lab/specimen/?motion=${mode}`)}
              title={lab.frameTitle(lab.modes[mode].name)}
              data-lab-column={mode}
            />
          </section>
        ))}
      </div>
    </>
  );
}
