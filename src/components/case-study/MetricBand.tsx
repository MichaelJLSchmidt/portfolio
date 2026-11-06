import { ContourDivider } from "@/components/ui/ContourDivider";
import styles from "./MetricBand.module.css";

/**
 * Breaker A: one oversized numeral and one sentence between contour dividers. The number is
 * static (no count-up).
 */
export function MetricBand({ value, line }: { value: string; line: string }) {
  return (
    <div className={`${styles.band} container section`} data-breaker="">
      <ContourDivider />
      <div className={styles.body} data-quiet-zone>
        <p className={`${styles.value} t-metric`}>{value}</p>
        <p className={styles.line}>{line}</p>
      </div>
      <ContourDivider />
    </div>
  );
}
