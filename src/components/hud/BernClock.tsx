"use client";

import { useEffect, useState } from "react";

const format = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Zurich",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Live Bern time. Minute precision keeps the instrument calm (no per-second flicker). */
export function BernClock({ label }: { label: string }) {
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
    <span>
      {label}{" "}
      <time dateTime={now?.toISOString()} suppressHydrationWarning>
        {now ? format.format(now) : "--:--"}
      </time>
    </span>
  );
}
