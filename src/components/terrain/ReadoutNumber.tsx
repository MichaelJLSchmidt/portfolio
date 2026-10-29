"use client";

import { AnimateNumber } from "motion-plus/react";
import { Fragment } from "react";
import { formatInteger } from "@/lib/format";
import { duration, easing } from "@/styles/tokens";

/**
 * A readout number that rolls to its new value with the terrain (AnimateNumber, Motion+), loaded
 * after hydration only. Browsers group "de-CH" numbers differently (Chromium writes ', Node ’),
 * so the grouping is formatInteger's and each thousands group rolls on its own: the digits match
 * the server-rendered text exactly. Groups are keyed from the right, so 4’158 → 554 rolls the
 * units and lets the thousands go.
 */
export default function ReadoutNumber({ value }: { value: number }) {
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
            transition={{ duration: duration.terrain / 1000, ease: [...easing.summit] }}
          >
            {Number(token)}
          </AnimateNumber>
        );
      })}
    </>
  );
}
