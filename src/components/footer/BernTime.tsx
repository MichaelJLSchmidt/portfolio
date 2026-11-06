"use client";

import { useEffect, useState } from "react";

const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/**
 * The live Bern time, to the minute: no seconds, no blinking colon, no rolling digits. It sits in
 * a box as wide as "00:00" in tabular figures, so filling in the "--:--" placeholder after
 * hydration moves nothing. A changing time is content, not motion: it updates in every tier.
 */
export function BernTime({ label, className }: { label: string; className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    let interval = 0;
    // Align to the next minute boundary, then tick every minute.
    const timeout = window.setTimeout(() => {
      update();
      interval = window.setInterval(update, 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <span className={className} style={{ gap: "0.6em" }}>
      <span>{label}</span>
      <time dateTime={now?.toISOString()} style={{ fontVariantNumeric: "tabular-nums" }} suppressHydrationWarning>
        {now ? clock.format(now) : "--:--"}
      </time>
    </span>
  );
}
