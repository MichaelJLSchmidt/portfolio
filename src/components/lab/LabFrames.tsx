"use client";

import { useEffect, useRef } from "react";
import { lab } from "@/content/lab";
import { asset } from "@/lib/asset";
import { SETTLED_STORAGE_KEY } from "@/lib/settled";
import type { MotionMode } from "@/lib/motion-mode";
import { FloodButton } from "@/components/interaction/FloodButton";
import { LAB_READY, markLabReady } from "./ready";
import styles from "./Lab.module.css";

const MODES: MotionMode[] = ["full", "calm", "still"];

/** The three columns: the specimen sheet in each mode, scrolled together; "Replay all" restarts them. */
export function LabFrames() {
  const frames = useRef<(HTMLIFrameElement | null)[]>([]);

  useEffect(() => {
    // Ready once every frame has hydrated (ready.ts): frames that did before this effect ran are
    // found by their attribute, later ones say so.
    const checkReady = () => {
      if (frames.current.filter((f) => f?.contentDocument?.documentElement.hasAttribute(LAB_READY)).length === MODES.length) markLabReady();
    };
    checkReady();
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.lab === "ready") return checkReady();
      if (e.data?.lab !== "scroll") return;
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
        <FloodButton label={lab.replay} onClick={replay} />
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
