import { Logbook } from "@/components/logbook/Logbook";
import { flood } from "@/content/flood";
import { home } from "@/content/home";
import { SectionHead } from "./SectionHead";
import styles from "./Home.module.css";

/** "Earlier work": older projects as a logbook (year, type, sector, role), newest first, no detail pages. */
export function EarlierWork() {
  const t = home.earlier;
  return (
    <section className={styles.section} aria-labelledby="earlier-heading">
      <SectionHead id="earlier-heading" heading={t.heading} flood={flood.sections.earlier} />
      <Logbook
        caption={t.caption}
        columns={[t.columns.year, t.columns.type, t.columns.sector, t.columns.role]}
        rows={t.entries.slice(0, 10).map((e) => [e.year, e.type, e.sector, e.role])}
      />
    </section>
  );
}
