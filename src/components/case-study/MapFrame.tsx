import type { CaseStudy } from "@/lib/case-study";
import { Figure } from "./Figure";
import styles from "./MapFrame.module.css";

/**
 * Breaker C: a full-bleed figure in a map-sheet frame: a hairline border with coordinate ticks
 * along its edges, corner crosshairs and the summit's coordinates in the corners (aria-hidden; the
 * figure keeps its own caption). It can always be enlarged (the lightbox), which on phones is the
 * way to see it in full.
 */
export function MapFrame({ id, study, coordinates }: { id: string; study: CaseStudy; coordinates: string | null }) {
  const spec = study.figures?.[id];
  if (!spec) return null;
  const [lat, lon] = coordinates?.split(/\s+(?=\d)/) ?? [];
  return (
    <div className={`${styles.frame} section`} data-breaker="">
      <div className={`${styles.sheet} container`}>
        <div className={styles.border}>
          <span className={`${styles.corner} ${styles.tl}`} aria-hidden="true" />
          <span className={`${styles.corner} ${styles.tr}`} aria-hidden="true" />
          <span className={`${styles.corner} ${styles.bl}`} aria-hidden="true" />
          <span className={`${styles.corner} ${styles.br}`} aria-hidden="true" />
          {lat && (
            <span className={`${styles.coord} ${styles.coordTop} mono`} aria-hidden="true">
              {lat}
            </span>
          )}
          {lon && (
            <span className={`${styles.coord} ${styles.coordBottom} mono`} aria-hidden="true">
              {lon}
            </span>
          )}
          <Figure spec={{ ...spec, size: "wide", zoom: true }} images={study.images ?? {}} assets={study.assets ?? {}} />
        </div>
      </div>
    </div>
  );
}
