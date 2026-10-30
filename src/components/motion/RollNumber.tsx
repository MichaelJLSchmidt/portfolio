"use client";

import { useEffect, useState, type ComponentType } from "react";
import { formatInteger } from "@/lib/format";
import { useModeIf } from "@/lib/motion-mode";
import { duration as durations } from "@/styles/tokens";
import type { RollDigitsProps } from "./roll-digits";
import styles from "./RollNumber.module.css";

type Digits = ComponentType<RollDigitsProps>;

// One shared lazy chunk for every rolling number on the page.
let chunk: Promise<Digits> | null = null;
const loadDigits = () => (chunk ??= import("./roll-digits").then((m) => m.default));

/** Loads the rolling digits ahead of a roll that should start at once (a card's first hover). */
export const preloadRoll = () => void loadDigits();

/**
 * A number that rolls to a new value, digit by digit (AnimateNumber, Motion+): the readout's
 * coordinates and altitude, the Bern clock, card stats. The server and hydration render the
 * plain digits (formatInteger, or zero-padded), so both agree. The Motion+ chunk loads only when a
 * value first changes (never in still, where numbers snap): until then the number is plain text,
 * and the first roll starts from the value that was on screen once the chunk is in, or, if it is
 * not in within --dur-tap, that change snaps (a stale number never stays on screen). Decorative:
 * give screen readers the value as text next to it and hide this (aria-hidden on a parent). Keeps
 * the line's height and baseline.
 */
export function RollNumber({ value, pad, trend, duration, className }: RollDigitsProps & { className?: string }) {
  const mode = useModeIf(true);
  const [Digits, setDigits] = useState<Digits | null>(null);
  // The value first rendered: on screen until the chunk is in, so the first roll starts from it.
  const [initial] = useState(value);
  const [armed, setArmed] = useState(false);
  // The chunk was not in soon enough after a change: the number snapped to its new value.
  const [late, setLate] = useState(false);

  useEffect(() => {
    if (mode === "still" || Digits || value === initial) return;
    let live = true;
    const timer = window.setTimeout(() => live && setLate(true), durations.tap);
    loadDigits().then((d) => {
      if (!live) return;
      window.clearTimeout(timer);
      setDigits(() => d);
      // Mounted at the old value first, the digits then roll to the new one.
      requestAnimationFrame(() => live && setArmed(true));
    });
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [value, mode, Digits, initial]);

  const roll = mode !== "still" ? Digits : null;
  const at = mode === "still" || armed || late ? value : initial;
  return (
    <span className={className ? `${styles.roll} ${className}` : styles.roll}>
      {roll ? <Rolled Digits={roll} value={at} pad={pad} trend={trend} duration={duration} /> : pad ? String(at).padStart(pad, "0") : formatInteger(at)}
    </span>
  );
}

const Rolled = ({ Digits, ...props }: RollDigitsProps & { Digits: Digits }) => <Digits {...props} />;
