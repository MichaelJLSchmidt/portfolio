import { MapSheet } from "@/components/motion/MapSheet";
import { RollValue } from "@/components/motion/RollValue";
import { isExample } from "@/content/example-values";
import { home } from "@/content/home";
import { SectionHead } from "./SectionHead";
import styles from "./Home.module.css";

/**
 * "What changed": the headline numbers, on a map sheet that unfolds. Each number rolls once from a
 * nearby value as it comes into view (a before → after pair rolls its after-value only).
 */
export function SummitLog() {
  const t = home.summitLog;
  const examples = t.entries.some((e) => isExample(e.value));
  return (
    <section className={styles.section} aria-labelledby="summit-log-heading">
      <SectionHead id="summit-log-heading" eyebrow={t.eyebrow} heading={t.heading} />
      <MapSheet className={styles.log}>
        <dl className={`${styles.logGrid} surface-copy`}>
          {t.entries.map((e) => (
            <div key={e.label}>
              <dt>{e.label}</dt>
              <dd>
                <RollValue value={e.value} only="last" />
              </dd>
            </div>
          ))}
        </dl>
        {examples && <p className={styles.smallPrint}>{t.smallPrint}</p>}
      </MapSheet>
    </section>
  );
}
