import type { CaseStudy } from "@/lib/case-study";
import { Figure } from "./Figure";
import styles from "./ImagePair.module.css";

/**
 * Two figures as an offset pair: columns 2–7 and 7–12 on wide screens, the second 120 px lower;
 * stacked on phones, the second 24 px in. On desktop in Full the pair drifts by at most 24 px as
 * it passes (a scroll-driven CSS animation where supported; nothing runs at rest).
 */
export function ImagePair({ ids, study, numbers }: { ids: [string, string]; study: CaseStudy; numbers: Map<string, number> }) {
  return (
    <div className={`${styles.pair} container grid`} data-breaker="">
      {ids.map((id, i) => {
        const spec = study.figures?.[id];
        if (!spec) throw new Error(`Figure "${id}" is not defined in the case study's figures.`);
        return (
          <div key={id} className={i === 0 ? styles.first : styles.second}>
            <Figure spec={{ ...spec, size: "column" }} images={study.images ?? {}} assets={study.assets ?? {}} number={numbers.get(id)} />
          </div>
        );
      })}
    </div>
  );
}
