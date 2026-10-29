"use client";

import { useEffect, useState } from "react";
import { RollNumber } from "@/components/motion/RollNumber";
import { SettleText } from "@/components/motion/SettleText";
import styles from "./Hud.module.css";

const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Zurich",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const read = (d: Date) => {
  const p = parts.formatToParts(d);
  const n = (type: string) => Number(p.find((x) => x.type === type)?.value ?? 0);
  return { h: n("hour"), m: n("minute") };
};

/**
 * Live Bern time. Minute precision keeps the instrument calm (no per-second flicker, no blinking
 * colon). When the minute turns, only the digits that changed roll upward (RollNumber, trend up);
 * still mode snaps. The time sits in a box reserved at "00:00" in the rest axes, so filling in
 * the "--:--" placeholder after hydration, a roll or the HUD condensing never moves anything.
 * Screen readers read the <time> text.
 */
export function BernClock({ label, className }: { label: string; className?: string }) {
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

  const t = now ? read(now) : null;
  const text = now ? parts.format(now) : "--:--";
  return (
    <span className={className}>
      <SettleText text={label} mode="block" role="mono" id="clock-label" scope="site" reserve="rest" className={styles.clockLabel} />{" "}
      <time className={styles.time} dateTime={now?.toISOString()} suppressHydrationWarning>
        <span className="visually-hidden">{text}</span>
        <span className={styles.timeBox} aria-hidden="true">
          <span className={styles.timeGhost}>00:00</span>
          <span className={styles.timeRun}>
            {t ? (
              <>
                <RollNumber value={t.h} pad={2} trend={1} duration="settle" />:<RollNumber value={t.m} pad={2} trend={1} duration="settle" />
              </>
            ) : (
              text
            )}
          </span>
        </span>
      </time>
    </span>
  );
}
