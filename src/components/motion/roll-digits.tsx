"use client";

import { AnimateNumber } from "motion-plus/react";
import { Fragment } from "react";
import { formatInteger } from "@/lib/format";
import { duration as durations, easing, type DurationToken } from "@/styles/tokens";

export type RollDigitsProps = {
  value: number;
  /** Zero-pads to this many digits and leaves out the grouping (a clock's minutes). */
  pad?: number;
  /** 1: digits always spin upward (a clock); 0: the shortest way. */
  trend?: number;
  duration?: DurationToken;
};

/**
 * The digits of a RollNumber (lazy: Motion+ loads after hydration, never in still). Browsers group
 * "de-CH" numbers differently (Chromium writes ', Node ’), so the grouping is formatInteger's and
 * each thousands group rolls on its own: the digits match the server-rendered text exactly. Groups
 * are keyed from the right, so 4’158 → 554 rolls the units and lets the thousands go. Only the
 * digits that change roll.
 */
export default function RollDigits({ value, pad, trend = 0, duration = "terrain" }: RollDigitsProps) {
  const transition = { duration: durations[duration] / 1000, ease: [...easing.summit] as [number, number, number, number] };
  if (pad) {
    return (
      <AnimateNumber locales="en" format={{ useGrouping: false, minimumIntegerDigits: pad }} trend={trend} transition={transition}>
        {value}
      </AnimateNumber>
    );
  }
  const tokens = formatInteger(value).split(/(\D)/).filter(Boolean);
  const digits = tokens.filter((t) => /^\d+$/.test(t)).length;
  let group = 0;
  return (
    <>
      {tokens.map((token, i) => {
        if (!/^\d+$/.test(token)) return <Fragment key={`s${i}`}>{token}</Fragment>;
        const fromRight = digits - 1 - group++;
        return (
          <AnimateNumber
            key={`g${fromRight}`}
            locales="en"
            format={{ useGrouping: false, minimumIntegerDigits: token.length }}
            trend={trend}
            transition={transition}
          >
            {Number(token)}
          </AnimateNumber>
        );
      })}
    </>
  );
}
