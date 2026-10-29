"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatInteger } from "@/lib/format";
import { currentMode } from "@/lib/motion-mode";
import { isSettled, markSettled, settleKey } from "@/lib/settled";
import { RollNumber, preloadRoll } from "./RollNumber";
import styles from "./RollNumber.module.css";

type Phase = "rest" | "from" | "to";
type Part = string | number;

/** "38% → 82%" → [38, "% → ", 82, "%"]: whole numbers (with their ’ groups) roll, the rest stays. */
const NUMBER = /(\d{1,3}(?:’\d{3})+|\d+(?:[.,]\d+)?)/;
const partsOf = (value: string): Part[] =>
  value
    .split(NUMBER)
    .filter(Boolean)
    .map((p) => (/^\d{1,3}(?:’\d{3})+$|^\d+$/.test(p) ? Number(p.replace(/’/g, "")) : p));

/** A value near enough to roll from: a little below it. */
const nearby = (n: number) => Math.max(0, n - Math.max(1, Math.round(n * 0.15)));

/**
 * A value as written ("71%", "2 → 6", "12’400") whose numbers roll once, the first time it is in
 * view this session (full and calm), from a nearby value a little below to their own. `only="last"`
 * rolls the last number alone: a before → after pair rolls its after-value. The server, screen
 * readers and still mode get the text as written; the box is reserved at it (the rolling copy lies
 * over it), so nothing around it moves.
 */
export function RollValue({ value, only, className }: { value: string; only?: "last"; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("rest");
  const parts = partsOf(value);
  const rolling = parts.map((p, i) => typeof p === "number" && (only !== "last" || i === parts.findLastIndex((q) => typeof q === "number")));

  useEffect(() => {
    const el = ref.current;
    const key = settleKey(pathname ?? "", `roll:${value}`);
    if (!el || !rolling.some(Boolean) || isSettled(key) || currentMode() === "still") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        markSettled(key);
        preloadRoll();
        setPhase("from");
        requestAnimationFrame(() => requestAnimationFrame(() => setPhase("to")));
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
    // `rolling` follows `value`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, value]);

  return (
    <span ref={ref} className={className ? `${styles.value} ${className}` : styles.value}>
      <span className="visually-hidden">{value}</span>
      <span className={styles.ghost} aria-hidden="true">
        {value}
      </span>
      <span className={styles.run} aria-hidden="true">
        {phase === "rest"
          ? value
          : parts.map((p, i) => (typeof p === "number" && rolling[i] ? <RollNumber key={i} value={phase === "from" ? nearby(p) : p} duration="settle" /> : <span key={i}>{typeof p === "number" ? formatInteger(p) : p}</span>))}
      </span>
    </span>
  );
}
