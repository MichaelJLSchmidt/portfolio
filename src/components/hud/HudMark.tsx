"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SettleText } from "@/components/motion/SettleText";
import styles from "./Hud.module.css";

/** The set symbol's rings, inner to outer (viewBox units); hover moves each one step outward. */
const RINGS = [2.75, 5.25, 7.75];

/**
 * The HUD's mark: a set symbol of three contour rings and the wordmark, linking home. Hovering or
 * focusing it moves the rings one step outward (a response); after a route change they trace
 * themselves again over --dur-trace (400 ms). The wordmark settles in mono on first load. The
 * link's name is "Höhenlinie, home".
 */
export function HudMark({ label, name }: { label: string; name: string }) {
  const pathname = usePathname();
  // The rings redraw on route changes only, not on the first load.
  const [first] = useState(pathname);
  const redraw = pathname !== first;
  return (
    <Link href="/" className={`${styles.mark} hud-label`} aria-label={name}>
      <svg key={redraw ? pathname : "first"} className={styles.rings} viewBox="0 0 20 20" aria-hidden="true" data-redraw={redraw || undefined}>
        {RINGS.map((r, i) => (
          <circle key={r} cx="10" cy="10" r={r} pathLength={1} style={{ "--ring": i, "--ring-step": (r + 2.5) / r } as React.CSSProperties} />
        ))}
      </svg>
      <SettleText text={label} mode="block" role="mono" id="hud-mark" scope="site" reserve="rest" className={styles.markText} />
    </Link>
  );
}
