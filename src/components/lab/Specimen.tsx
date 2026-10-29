"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { lab } from "@/content/lab";
import { haptic } from "@/lib/haptics";
import { useMotionMode } from "@/lib/motion-mode";
import { haptics, type HapticEvent } from "@/styles/tokens";
import { ContourRule } from "@/components/motion/ContourRule";
import { Glint } from "@/components/motion/Glint";
import { playGlint } from "@/components/motion/glint";
import { MapSheet } from "@/components/motion/MapSheet";
import { MotionButton } from "@/components/motion/MotionButton";
import { SettleText, type SettleHandle } from "@/components/motion/SettleText";
import { SignatureLink } from "@/components/motion/SignatureLink";
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
  const chars = useRef<SettleHandle>(null);
  const words = useRef<SettleHandle>(null);
  const label = useRef<SettleHandle>(null);
  const mono = useRef<SettleHandle>(null);
  const glintDark = useRef<HTMLParagraphElement>(null);
  const glintSheet = useRef<HTMLParagraphElement>(null);

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

      <section className={styles.section} data-primitive="settle">
        <h2 className="hud-label">{S.settle.title}</h2>
        <p className={styles.note}>{S.settle.note}</p>
        <div className={styles.row}>
          <SettleText ref={chars} as="p" id="lab-chars" text={S.settle.chars} className={`${styles.big} display`} trigger="paint" />
          <MotionButton label={t.replay} onClick={() => chars.current?.play()} />
        </div>
        <div className={styles.row}>
          <SettleText ref={words} as="p" id="lab-words" mode="words" text={S.settle.words} className={`${styles.mid} display`} trigger="manual" />
          <MotionButton label={t.replay} onClick={() => words.current?.play()} />
        </div>
        <div className={styles.row}>
          <SettleText ref={label} as="p" id="lab-label" mode="block" text={S.settle.label} trigger="manual" />
          <SettleText ref={mono} as="p" id="lab-mono" mode="block" role="mono" text={S.settle.mono} className="hud-label" trigger="manual" />
          <MotionButton
            label={t.replay}
            onClick={() => {
              label.current?.play();
              mono.current?.play();
            }}
          />
        </div>
      </section>

      <section className={styles.section} data-primitive="glint">
        <h2 className="hud-label">{S.glint.title}</h2>
        <p className={styles.note}>{S.glint.note}</p>
        <div className={styles.row}>
          <p ref={glintDark} className={`${styles.mid} ${styles.glintHost} display`}>
            {S.glint.dark}
            <Glint text={S.glint.dark} />
          </p>
          <MotionButton label={t.playGlint} onClick={() => playGlint(glintDark.current)} />
        </div>
        <div className={`${styles.row} ${styles.sheetRow}`}>
          <p ref={glintSheet} className={`${styles.glintHost} ${styles.sheetText}`}>
            {S.glint.sheet}
            <Glint text={S.glint.sheet} surface="sheet" />
          </p>
          <MotionButton label={t.playGlint} onClick={() => playGlint(glintSheet.current)} />
        </div>
      </section>

      <section className={styles.section} data-primitive="shine">
        <h2 className="hud-label">{S.shine.title}</h2>
        <p className={styles.note}>{S.shine.note}</p>
        <SettleText as="p" id="lab-shine" text={S.shine.text} className={`${styles.big} display`} trigger="manual" shine />
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
                      <SignatureLink href="#lab-links" variant="inline" label={S.link.inline} data-lab-state={s} />.
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
                    <SignatureLink href="#lab-links" variant="standalone" label={S.link.standalone} arrow={t.arrow} data-lab-state={s} />
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="hud-label">
                  {t.variants.nav}
                </th>
                {states.map((s) => (
                  <td key={s}>
                    <SignatureLink href="#lab-links" variant="nav" label={S.link.nav} className="hud-label" data-lab-state={s} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p id="lab-links" className={styles.row}>
          <SignatureLink href="#lab-links" variant="nav" label={S.link.navCurrent} className="hud-label" current />
        </p>
        <div className={styles.displayLinks}>
          {states.map((s) => (
            <SignatureLink
              key={s}
              href="#lab-links"
              variant="display"
              className={styles.nextLink}
              before={<span className="hud-label">{`${S.link.eyebrow} · ${t.states[s]}`}</span>}
              label={S.link.display}
              labelClassName={`${styles.nextName} display`}
              arrow={t.arrow}
              data-lab-state={s}
            />
          ))}
        </div>
      </section>

      <section className={styles.section} data-primitive="button">
        <h2 className="hud-label">{S.button.title}</h2>
        <p className={styles.note}>{S.button.note}</p>
        <div className={styles.row}>
          {states.map((s) => (
            <MotionButton key={s} label={S.button.label} data-lab-state={s} className="hud-label" />
          ))}
        </div>
      </section>

      <section className={styles.section} data-primitive="haptics">
        <h2 className="hud-label">{S.haptics.title}</h2>
        <p className={styles.note}>{S.haptics.note}</p>
        <div className={styles.row}>
          {(Object.keys(haptics.patterns) as HapticEvent[]).map((event) => (
            <MotionButton key={event} label={event} className="hud-label" onClick={() => haptic(event)} />
          ))}
        </div>
      </section>

      <p className={`${styles.spacer} hud-label`}>{t.spacer}</p>

      <section className={styles.section} data-primitive="reveal">
        <h2 className="hud-label">{S.reveal.title}</h2>
        <p className={styles.note}>{S.reveal.note}</p>
        <SettleText as="p" id="lab-inview" text={S.settle.chars} className={`${styles.big} display`} trigger="inview" />
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
