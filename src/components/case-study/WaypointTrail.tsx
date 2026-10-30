"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { currentMode } from "@/lib/motion-mode";
import { duration } from "@/styles/tokens";
import { meterReading, startReadingSpy, useReading } from "./reading";
import styles from "./WaypointTrail.module.css";

/**
 * "On this page" from the large breakpoint: the waypoints as a vertical contour trail beside the
 * content. It runs the page's reading spy (reading.ts), also when it is hidden (the altimeter bar
 * uses it). The trail fills with glacier as the reader scrolls (scroll-linked,
 * --reading); the current waypoint's pin pings once as it becomes current (full motion); aria-current="true" marks its link. Without JavaScript
 * it is a plain list of links.
 */
export function WaypointTrail({ slug, label, items }: { slug: string; label: string; items: { id: string; nav: string }[] }) {
  const { slug: readingSlug, index } = useReading();
  const active = readingSlug === slug ? index : -1;
  const listRef = useRef<HTMLOListElement>(null);
  const last = useRef(-1);

  useEffect(() => startReadingSpy(slug, items.map((i) => i.id)), [slug, items]);
  useEffect(() => (listRef.current ? meterReading(listRef.current) : undefined), []);

  // One ping as a waypoint becomes current (not for the one current on arrival).
  useEffect(() => {
    const previous = last.current;
    last.current = active;
    if (active < 0 || previous === active || currentMode() !== "full") return;
    if (previous < 0 && window.scrollY < 1) return;
    const item = listRef.current?.children[active];
    item?.setAttribute("data-ping", "");
    const t = window.setTimeout(() => item?.removeAttribute("data-ping"), duration.long);
    return () => {
      window.clearTimeout(t);
      item?.removeAttribute("data-ping");
    };
  }, [active]);

  return (
    <nav className={styles.trail} aria-label={label}>
      <p className={`${styles.title} hud-label map-halo`} aria-hidden="true" data-quiet-zone>
        {label}
      </p>
      <ol ref={listRef} className={styles.list} style={{ "--n": items.length } as CSSProperties}>
        {items.map((item, i) => (
          <li
            key={item.id}
            className={styles.item}
            data-state={i < active ? "passed" : i === active ? "current" : "ahead"}
            style={{ "--i": i } as CSSProperties}
          >
            <span className={styles.ping} aria-hidden="true" />
            <a href={`#${item.id}`} className={styles.link} aria-current={i === active ? "true" : undefined}>
              <span className={styles.label}>{item.nav}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
