"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { lab } from "@/content/lab";
import { haptic } from "@/lib/haptics";
import { useMotionMode } from "@/lib/motion-mode";
import { haptics, type HapticEvent } from "@/styles/tokens";
import { FloodButton } from "@/components/interaction/FloodButton";
import { TrailLink } from "@/components/interaction/TrailLink";
import { ContourRule } from "@/components/motion/ContourRule";
import { MapSheet } from "@/components/motion/MapSheet";
import { WeightTitle } from "@/components/type/WeightTitle";
import { useLabReady } from "./ready";
import styles from "./Lab.module.css";

const t = lab.specimen;
const S = t.sections;
const states = ["rest", "on", "press"] as const;

/**
 * The motion lab's specimen sheet: every primitive with its states, in the mode this page was
 * loaded in (?motion=full|calm|still, preview builds only). The lab page shows three of these side
 * by side; each section is marked data-primitive for the layout-shift probes (npm run test:e2e).
 */
export function Specimen() {
  const { mode, tier, haptics: hapticsOn, hapticsAvailable } = useMotionMode();
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
      <dl className={`${styles.readout} hud-label`}>
        <div>
          <dt>{t.mode}</dt>
          <dd data-lab-mode={mode}>{mode}</dd>
        </div>
        <div>
          <dt>{t.tier}</dt>
          <dd>{tier}</dd>
        </div>
        <div>
          <dt>{t.haptics}</dt>
          <dd>{hapticsAvailable ? (hapticsOn ? t.on : t.off) : t.unsupported}</dd>
        </div>
      </dl>

      <section className={styles.section} data-primitive="title">
        <h2 className="hud-label">{S.title.title}</h2>
        <p className={styles.note}>{S.title.note}</p>
        <div className={styles.row} key={round}>
          <WeightTitle as="p" id="lab-title" text={S.title.big} arrive="load" className={styles.big} />
          <WeightTitle as="p" id="lab-title-mid" text={S.title.mid} arrive="load" className={styles.mid} />
        </div>
        <div className={styles.row}>
          <FloodButton label={t.replay} onClick={() => setRound((r) => r + 1)} />
        </div>
      </section>

      <section className={styles.section} data-primitive="link">
        <h2 className="hud-label">{S.link.title}</h2>
        <p className={styles.note}>{S.link.note}</p>
        <div className={styles.scroller}>
          <table className={styles.states}>
            <thead>
              <tr>
                <th scope="col" />
                {states.map((s) => (
                  <th key={s} scope="col" className="hud-label">
                    {t.states[s]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className="hud-label">
                  {t.variants.inline}
                </th>
                {states.map((s) => (
                  <td key={s}>
                    <p className="body-copy">
                      {S.link.inlineBefore}
                      <TrailLink href="#lab-links" variant="inline" data-lab-state={s}>
                        {S.link.inline}
                      </TrailLink>
                      .
                    </p>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="hud-label">
                  {t.variants.standalone}
                </th>
                {states.map((s) => (
                  <td key={s}>
                    <TrailLink href="#lab-links" arrow={t.arrow} data-lab-state={s}>
                      {S.link.standalone}
                    </TrailLink>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="hud-label">
                  {t.variants.back}
                </th>
                {states.map((s) => (
                  <td key={s}>
                    <TrailLink href="#lab-links" arrow="←" arrowAt="start" className="hud-label" data-lab-state={s}>
                      {S.link.back}
                    </TrailLink>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div id="lab-links" className={styles.displayLinks}>
          {states.map((s) => (
            <div key={s} className={styles.nextLink}>
              <span className="hud-label">{`${S.link.eyebrow} · ${t.states[s]}`}</span>
              <TrailLink href="#lab-links" className={`${styles.nextName} display`} data-lab-state={s}>
                {S.link.display}
              </TrailLink>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} data-primitive="button">
        <h2 className="hud-label">{S.button.title}</h2>
        <p className={styles.note}>{S.button.note}</p>
        <div className={styles.row}>
          {states.map((s) => (
            <FloodButton key={s} label={S.button.label} data-lab-state={s} />
          ))}
        </div>
      </section>

      <section className={styles.section} data-primitive="haptics">
        <h2 className="hud-label">{S.haptics.title}</h2>
        <p className={styles.note}>{S.haptics.note}</p>
        <div className={styles.row}>
          {(Object.keys(haptics.patterns) as HapticEvent[]).map((event) => (
            <FloodButton key={event} label={event} pressHaptic={false} onClick={() => haptic(event)} />
          ))}
        </div>
      </section>

      <p className={`${styles.spacer} hud-label`}>{t.spacer}</p>

      <section className={styles.section} data-primitive="reveal">
        <h2 className="hud-label">{S.reveal.title}</h2>
        <p className={styles.note}>{S.reveal.note}</p>
        <WeightTitle as="p" id="lab-inview" text={S.title.big} className={styles.big} />
        <ContourRule />
        {[S.reveal.block, S.reveal.block, S.reveal.block].map((text, i) => (
          <p key={i} className={`${styles.block} hud-label`} data-reveal="" style={{ "--i": i } as CSSProperties}>
            {text}
          </p>
        ))}
        <div className={styles.cardBlock} data-reveal="card">
          {S.reveal.card}
        </div>
        <ContourRule />
        <MapSheet className={styles.sheet}>
          <p>{S.reveal.sheet}</p>
        </MapSheet>
      </section>
    </div>
  );
}
