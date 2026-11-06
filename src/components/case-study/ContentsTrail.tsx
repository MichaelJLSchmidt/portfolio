"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ContentsEntry } from "@/lib/survey-layout";
import styles from "./ContentsTrail.module.css";

/**
 * The contents trail: the page's parts as a list of links, the current one marked by a short mint
 * index line (aria-current="location").
 *
 * - Wide screens (≥ 1280 px): a rail in the left three columns that stays in view from chapter 01
 *   to the foot of the page, beside the chapters' text. It steps aside (fades over --dur-fast)
 *   while a band or a layout breaker passes under it.
 * - Below: a sticky "Contents" bar, 40 px high, under the header; it opens the list as a
 *   disclosure and closes once a part is chosen.
 *
 * One scroll listener (passive, one read per frame) finds the current part and whether a breaker
 * is under the rail. Without JavaScript the list is a plain list of links.
 */
export function ContentsTrail({ entries, label, toggle }: { entries: ContentsEntry[]; label: string; toggle: string }) {
  const ref = useRef<HTMLElement>(null);
  const listId = useId();
  const [current, setCurrent] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const list = nav.querySelector("ol");
    const sections = entries.map((e) => document.getElementById(e.id)).filter((el): el is HTMLElement => !!el);
    const breakers = [...document.querySelectorAll<HTMLElement>("[data-breaker]")];
    let frame = 0;
    const read = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let at: string | null = null;
      for (const s of sections) if (s.getBoundingClientRect().top <= line) at = s.id;
      setCurrent(at);
      const rail = list?.getBoundingClientRect();
      if (rail && rail.height) setOver(breakers.some((b) => {
        const r = b.getBoundingClientRect();
        return r.top < rail.bottom && r.bottom > rail.top;
      }));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [entries]);

  const here = entries.find((e) => e.id === current);
  return (
    <nav ref={ref} className={styles.trail} aria-label={label} data-contents="" data-over={over || undefined} data-open={open || undefined}>
      <div className={`${styles.inner} container`}>
        <button type="button" className={`${styles.toggle} mono`} aria-expanded={open} aria-controls={listId} onClick={() => setOpen((o) => !o)}>
          <span>{toggle}</span>
          {here && <span className={styles.here}>{here.label}</span>}
          <span className={styles.chevron} aria-hidden="true" />
        </button>
        <ol id={listId} className={styles.list}>
          {entries.map((e) => (
            <li key={e.id}>
              <a href={`#${e.id}`} className={`${styles.link} mono plain`} aria-current={e.id === current ? "location" : undefined} onClick={() => setOpen(false)}>
                {e.label}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
