import Link from "next/link";
import { MapSheetCard } from "@/components/card/MapSheetCard";
import type { CardData } from "@/content/cards";
import styles from "./NextCase.module.css";

/**
 * The foot of a case study: "Next case study" with the next project's mini card (its art window is
 * the element that travels into the next header plate), then "Back to case studies".
 */
export function NextCase({
  next,
  outcome,
  index,
  total,
  labels,
}: {
  next: CardData | null;
  outcome: string;
  index: number;
  total: number;
  labels: { next: string; backToAll: string };
}) {
  return (
    <nav className={styles.next} aria-label={labels.next}>
      {next && (
        <div className={styles.lead}>
          <p className={`${styles.label} mono`}>{labels.next}</p>
          <MapSheetCard card={next} outcome={outcome} index={index} total={total} size="mini" headingLevel={2} />
        </div>
      )}
      <Link href="/#case-studies" className={`${styles.back} cta`}>
        <span data-arrow="back" aria-hidden="true">
          ←
        </span>
        {labels.backToAll}
      </Link>
    </nav>
  );
}
