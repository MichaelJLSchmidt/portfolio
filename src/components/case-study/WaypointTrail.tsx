"use client";

import { useEffect, useState } from "react";
import styles from "./WaypointTrail.module.css";

/**
 * "On this page" from 1200 px: the waypoints as a vertical contour trail beside the content. The
 * trail fills up to the waypoint being read (scroll-spy; aria-current="true" on its link); the
 * fill is decoration only. Without JavaScript it is a plain list of links.
 */
export function WaypointTrail({ label, items }: { label: string; items: { id: string; nav: string }[] }) {
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const sections = items.map((i) => document.getElementById(i.id)).filter((s): s is HTMLElement => !!s);
    let frame = 0;
    const update = () => {
      frame = 0;
      // The current waypoint is the last one whose top has passed a line 30% down the screen;
      // at the very bottom of the page, the last one.
      const line = window.innerHeight * 0.3;
      let index = -1;
      sections.forEach((s, i) => {
        if (s.getClientRects().length && s.getBoundingClientRect().top <= line) index = i;
      });
      const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (bottom && index >= 0) index = sections.length - 1;
      setActive(index);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [items]);

  return (
    <nav className={styles.trail} aria-label={label}>
      <p className={`${styles.title} hud-label`} aria-hidden="true">
        {label}
      </p>
      <ol className={styles.list}>
        {items.map((item, i) => (
          <li key={item.id} className={styles.item} data-state={i < active ? "passed" : i === active ? "current" : "ahead"}>
            <a href={`#${item.id}`} className={styles.link} aria-current={i === active ? "true" : undefined}>
              {item.nav}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
