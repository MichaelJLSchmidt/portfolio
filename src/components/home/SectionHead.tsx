import { RuledHeading } from "@/components/motion/RuledHeading";
import styles from "./Home.module.css";

/**
 * A section's head: the line leads. A contour rule draws, then the title arrives on its weight
 * (WeightTitle) as the section scrolls into view; a section that starts in the first viewport is
 * simply there.
 */
export function SectionHead({
  id,
  eyebrow,
  heading,
  align = "start",
  flood,
  children,
}: {
  /** The heading's id, for the section's aria-labelledby. */
  id: string;
  eyebrow?: string;
  heading: string;
  align?: "start" | "center";
  /** The contour flood on the title (src/content/flood.ts). */
  flood?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.head} data-align={align} data-quiet-zone>
      {eyebrow && <p className={`${styles.eyebrow} hud-label map-halo knockout`}>{eyebrow}</p>}
      <RuledHeading id={id} text={heading} className={`${styles.heading} display`} ruleClassName={styles.headRule} flood={flood} />
      {children}
    </div>
  );
}
