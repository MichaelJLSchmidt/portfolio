import { RuledHeading } from "@/components/motion/RuledHeading";
import { SettleText } from "@/components/motion/SettleText";
import styles from "./Home.module.css";

/**
 * A section's head: the line leads. A contour rule draws, the eyebrow settles in mono (chars),
 * then the heading settles as one block (letters in their rest-width boxes, no cascade), as the
 * section scrolls into view; a section that starts in the first viewport is simply there.
 * Headings take turns (channel "heading") and snap while the reader scrolls fast.
 */
export function SectionHead({
  id,
  eyebrow,
  heading,
  trigger = "inview",
  align = "start",
  children,
}: {
  /** The heading's id, for the section's aria-labelledby. */
  id: string;
  eyebrow: string;
  heading: string;
  trigger?: "paint" | "inview";
  align?: "start" | "center";
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.head} data-align={align} data-quiet-zone>
      <SettleText as="p" text={eyebrow} mode="chars" role="mono" trigger={trigger} className={`${styles.eyebrow} hud-label map-halo`} />
      <RuledHeading id={id} text={heading} trigger={trigger} className={`${styles.heading} display`} ruleClassName={styles.headRule} />
      {children}
    </div>
  );
}
