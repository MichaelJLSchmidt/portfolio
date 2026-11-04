"use client";

import { useEffect, useState } from "react";
import { lab } from "@/content/lab";
import { useMotionMode } from "@/lib/motion-mode";
import { MotionControl } from "@/components/footer/MotionControl";
import { Title } from "@/components/type/Title";
import { SurveyButton } from "@/components/ui/SurveyButton";
import { ContourDivider } from "@/components/ui/ContourDivider";
import { useLabReady } from "./ready";
import styles from "./Lab.module.css";

const t = lab.specimen;
const S = t.sections;

/**
 * The motion lab's specimen sheet: every primitive, in the tier this page was loaded in
 * (?motion=full|calm|still, preview builds only). The lab page shows three of these side by side;
 * each section is marked data-primitive for the layout-shift probes (npm run test:e2e).
 */
export function Specimen() {
  const { mode, tier } = useMotionMode();
  // Replay: a new key remounts the titles, so their arrival runs again.
  const [round, setRound] = useState(0);
  useLabReady();

  // Side by side: a column's scroll position is mirrored in the other columns (lab page).
  useEffect(() => {
    if (window.parent === window) return;
    let echo = -1;
    const onScroll = () => {
      if (Math.round(window.scrollY) === echo) return;
      window.parent.postMessage({ lab: "scroll", y: window.scrollY }, window.location.origin);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.lab !== "scrollTo") return;
      echo = Math.round(e.data.y);
      window.scrollTo(0, e.data.y);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <div className={styles.specimen}>
      <dl className={`${styles.readout} mono`}>
        <div>
          <dt>{t.mode}</dt>
          <dd data-lab-mode={mode}>{mode}</dd>
        </div>
        <div>
          <dt>{t.tier}</dt>
          <dd>{tier}</dd>
        </div>
      </dl>

      <section className={styles.section} data-primitive="title">
        <h2 className="mono">{S.title.title}</h2>
        <p className={styles.note}>{S.title.note}</p>
        <div className={styles.row} key={round}>
          <Title as="p" role="display" text={S.title.big} />
          <Title as="p" role="h1" text={S.title.mid} />
        </div>
        <div className={styles.row}>
          <SurveyButton arrow={null} onClick={() => setRound((r) => r + 1)}>
            {t.replay}
          </SurveyButton>
        </div>
      </section>

      <section className={styles.section} data-primitive="link">
        <h2 className="mono">{S.link.title}</h2>
        <p className={styles.note}>{S.link.note}</p>
        <p className="body-copy">
          {S.link.inlineBefore}
          <a href="#lab-links">{S.link.inline}</a>
          {S.link.inlineAfter}
        </p>
        <div className={styles.row} id="lab-links">
          <a href="#lab-links" className="cta">
            {S.link.standalone}
            <span data-arrow="" aria-hidden="true">
              →
            </span>
          </a>
          <a href="#lab-links" className="cta">
            <span data-arrow="back" aria-hidden="true">
              ←
            </span>
            {S.link.back}
          </a>
        </div>
        <div className={styles.sheet} data-surface="sheet">
          <a href="#lab-links">{S.link.sheet}</a>
        </div>
      </section>

      <section className={styles.section} data-primitive="button">
        <h2 className="mono">{S.button.title}</h2>
        <p className={styles.note}>{S.button.note}</p>
        <div className={styles.row}>
          <SurveyButton primary>{S.button.label}</SurveyButton>
          <SurveyButton disabled>{S.button.label}</SurveyButton>
        </div>
      </section>

      <section className={styles.section} data-primitive="control">
        <h2 className="mono">{S.control.title}</h2>
        <p className={styles.note}>{S.control.note}</p>
        <div className={`${styles.row} mono`}>
          <MotionControl />
        </div>
        <ContourDivider />
      </section>

      <p className={styles.spacer}>{t.spacer}</p>

      <section className={styles.section} data-primitive="reveal">
        <h2 className="mono">{S.reveal.title}</h2>
        <p className={styles.note}>{S.reveal.note}</p>
        <div className={styles.block} data-reveal="">
          <p className="body-copy">{S.reveal.block}</p>
        </div>
      </section>
    </div>
  );
}
