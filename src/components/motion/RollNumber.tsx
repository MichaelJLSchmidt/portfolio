"use client";

import { useEffect, useState, type ComponentType } from "react";
import { formatInteger } from "@/lib/format";
import { useMotionMode } from "@/lib/motion-mode";
import type { RollDigitsProps } from "./roll-digits";
import styles from "./RollNumber.module.css";

type Digits = ComponentType<RollDigitsProps>;

// One shared lazy chunk for every rolling number on the page.
let chunk: Promise<Digits> | null = null;
const loadDigits = () => (chunk ??= import("./roll-digits").then((m) => m.default));

/**
 * A number that rolls to a new value, digit by digit (AnimateNumber, Motion+): the readout's
 * coordinates and altitude, the Bern clock, card stats. The server and hydration render the
 * plain digits (formatInteger, or zero-padded), so both agree; after hydration the Motion+ chunk
 * loads (never in still, where numbers snap). Decorative: give screen readers the value as
 * text next to it and hide this (aria-hidden on a parent). Keeps the line's height and baseline.
 */
export function RollNumber({ value, pad, trend, duration, className }: RollDigitsProps & { className?: string }) {
  const { mode } = useMotionMode();
  const [Digits, setDigits] = useState<Digits | null>(null);
  useEffect(() => {
    if (mode === "still") return;
    let live = true;
    loadDigits().then((d) => live && setDigits(() => d));
    return () => {
      live = false;
    };
  }, [mode]);
  const roll = mode !== "still" ? Digits : null;
  return (
    <span className={className ? `${styles.roll} ${className}` : styles.roll}>
      {roll ? <Rolled Digits={roll} value={value} pad={pad} trend={trend} duration={duration} /> : pad ? String(value).padStart(pad, "0") : formatInteger(value)}
    </span>
  );
}

const Rolled = ({ Digits, ...props }: RollDigitsProps & { Digits: Digits }) => <Digits {...props} />;
