import styles from "./CaseStudy.module.css";

/** Above the H1 of a flagged example: on the sheet colour, a stamp, the label and why. */
export function FictionBanner({ label, text }: { label: string; text: string }) {
  return (
    <p className={`${styles.banner} surface-copy`} role="note" data-vt-exit>
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
