import { SettleText } from "@/components/motion/SettleText";
import styles from "./Home.module.css";

/**
 * A section's eyebrow and heading: the eyebrow is a mono label, the heading settles as it
 * scrolls into view (or from first paint, for a section that starts in the first viewport).
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
      <p className={`${styles.eyebrow} hud-label map-halo`} data-reveal="">
        {eyebrow}
      </p>
      <SettleText as="h2" id={id} text={heading} className={`${styles.heading} display`} trigger={trigger} />
      {children}
    </div>
  );
}
