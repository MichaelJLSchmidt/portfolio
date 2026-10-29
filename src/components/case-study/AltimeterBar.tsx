"use client";

import { useEffect, useId, useRef } from "react";
import { SettleText, type SettleHandle } from "@/components/motion/SettleText";
import { readoutCopy } from "@/content/readout";
import { haptic } from "@/lib/haptics";
import { meterReading, useReading } from "./reading";
import styles from "./CaseStudy.module.css";

/**
 * The altimeter bar, below the large breakpoint (where the "On this page" trail has no room): a
 * bar along the bottom of the screen once the reader reaches the first waypoint, "WAYPOINT 2 / 6"
 * and the waypoint's name, which settles on every change of waypoint, over a thin contour that
 * fills with the reading progress. Tapping it opens the waypoints as a bottom sheet (a modal
 * <dialog>: focus inside, Esc closes, focus returns), rising over --dur-sheet (300 ms; still mode
 * fades it in); a jump ticks the detent haptic, scrolls to the waypoint and moves focus to its
 * heading. Without JavaScript there is no bar: the "On this page" chips at the top of the page
 * serve instead.
 */
export function AltimeterBar({
  slug,
  items,
  labels,
}: {
  slug: string;
  items: { id: string; nav: string }[];
  labels: { bar: string; sheet: string; close: string };
}) {
  const { slug: readingSlug, index, count } = useReading();
  const active = readingSlug === slug ? index : -1;
  const barRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<SettleHandle>(null);
  const id = useId();

  useEffect(() => (barRef.current ? meterReading(barRef.current) : undefined), []);
  // The waypoint's name settles in on every change.
  useEffect(() => {
    if (active >= 0) nameRef.current?.play();
  }, [active]);

  const open = () => {
    const sheet = sheetRef.current;
    if (!sheet || sheet.open) return;
    haptic("press");
    sheet.showModal();
    sheet.querySelector<HTMLElement>("a[aria-current]")?.focus();
  };
  const jump = (target: string) => {
    haptic("detent");
    sheetRef.current?.close();
    // The link scrolls to the waypoint; its heading takes focus once there.
    window.setTimeout(() => {
      const heading = document.getElementById(`${target}-heading`);
      if (!heading) return;
      heading.setAttribute("tabindex", "-1");
      heading.setAttribute("data-route-focus", "");
      heading.focus({ preventScroll: true });
    }, 0);
  };

  const current = items[active];
  return (
    <>
      <nav ref={barRef} className={styles.altimeter} aria-label={labels.bar} data-shown={current ? "" : undefined}>
        <span className={styles.altimeterLine} aria-hidden="true" />
        <button type="button" className={styles.altimeterButton} aria-haspopup="dialog" aria-controls={`${id}sheet`} onClick={open} tabIndex={current ? undefined : -1}>
          <span className={`${styles.altimeterCount} hud-label`}>
            {readoutCopy.waypoint} {active + 1} / {count || items.length}
          </span>
          <SettleText ref={nameRef} text={current?.nav ?? items[0]?.nav ?? ""} mode="block" role="label" trigger="manual" className={styles.altimeterName} />
          <span className={styles.altimeterArrow} aria-hidden="true">
            ↑
          </span>
        </button>
      </nav>
      <dialog ref={sheetRef} id={`${id}sheet`} className={styles.jumpSheet} aria-labelledby={`${id}title`} data-lenis-prevent>
        <div className={styles.jumpSheetBar}>
          <h2 id={`${id}title`} className="hud-label">
            {labels.sheet}
          </h2>
          <button
            type="button"
            className={`${styles.jumpSheetClose} hud-label`}
            onClick={() => {
              haptic("press");
              sheetRef.current?.close();
            }}
          >
            {labels.close}
          </button>
        </div>
        <ol className={styles.jumpSheetList}>
          {items.map((item, i) => (
            <li key={item.id}>
              <a href={`#${item.id}`} aria-current={i === active ? "true" : undefined} onClick={() => jump(item.id)}>
                <span className="hud-label" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.nav}
              </a>
            </li>
          ))}
        </ol>
      </dialog>
    </>
  );
}
