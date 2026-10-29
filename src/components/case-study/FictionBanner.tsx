import { duration } from "@/styles/tokens";
import styles from "./CaseStudy.module.css";

/**
 * Above the H1 of a flagged example: on the sheet colour, a stamp, the label and why, behind an
 * alpenglow-ink rule. A small map sheet: it unfolds from its top fold over --dur-unfold (240 ms) as
 * the page arrives by a link (once the old page has left) or as it scrolls into view, and stays:
 * it is never dismissed.
 */
export function FictionBanner({ label, text }: { label: string; text: string }) {
  return (
    <p
      className={`${styles.banner} surface-copy`}
      role="note"
      data-vt-exit
      data-reveal="sheet"
      data-fold="top"
      data-arrive-at={duration.leave}
      data-arrive-dur={duration.unfold}
    >
      <svg className={styles.bannerStamp} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" />
        <circle cx="12" cy="12" r="7.5" />
        <path d="M8.5 12h7M12 8.5v7" />
      </svg>
      <span>
        <strong className={styles.bannerLabel}>{label}</strong> — {text}
      </span>
    </p>
  );
}
