import type { ReactNode } from "react";
import type { about } from "@/content/about";
import styles from "./FieldKit.module.css";

/**
 * Skills beyond design, laid out like a field kit: each skill a line pictogram (1.5 px, the
 * contour's colour, hidden from screen readers: the name says what it is), its name, one sentence
 * and its proof in mono. Three to a row on desktop, two on tablets, one column with 32 px
 * pictograms on phones. Nothing moves.
 */
const pictograms: Record<string, ReactNode> = {
  /** A flip chart on its easel. */
  workshop: <path d="M5 3h14v10H5zM12 13v8M8 21l4-8 4 8M8 7h8M8 10h5" />,
  /** Two people, one a step ahead. */
  coaching: (
    <>
      <circle cx="8" cy="6.5" r="2.5" />
      <path d="M3 21v-3a5 5 0 0 1 10 0v3" />
      <circle cx="17" cy="9.5" r="2" />
      <path d="M13.5 21v-2a3.5 3.5 0 0 1 7 0v2" />
    </>
  ),
  /** Three parties joined to one decision. */
  stakeholders: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="12" cy="3.5" r="1.5" />
      <circle cx="4" cy="19" r="1.5" />
      <circle cx="20" cy="19" r="1.5" />
      <path d="M12 5v4.5M5.3 18 10 13.5M18.7 18 14 13.5" />
    </>
  ),
  /** A pencil over a ruled line. */
  writing: <path d="M3 21h8M15 4l5 5L9 20H4v-5zM13 6l5 5" />,
  /** Angle brackets: markup. */
  code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />,
  /** A balance: both sides heard. */
  conflict: <path d="M12 3v17M7 20h10M4 7h16M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z" />,
};

export function FieldKit({ copy }: { copy: typeof about.skills }) {
  return (
    <ul className={styles.kit} data-quiet-zone>
      {copy.items.map((s) => (
        <li key={s.name} className={styles.item}>
          <svg className={styles.pictogram} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {pictograms[s.icon]}
          </svg>
          <h3 className={styles.name}>{s.name}</h3>
          <p className={`${styles.text} body-copy`}>{s.text}</p>
          <p className={`${styles.proof} hud-label`}>
            <span className={styles.proofLabel}>{copy.proofLabel}</span> {s.proof}
          </p>
        </li>
      ))}
    </ul>
  );
}
