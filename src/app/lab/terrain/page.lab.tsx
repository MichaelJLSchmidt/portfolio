import type { Metadata } from "next";
import { terrainLab } from "./copy";
import { TerrainLab } from "./TerrainLab";
import styles from "./TerrainLab.module.css";

/**
 * The terrain lab: route morphs, the readout, and the motion-mode and tier overrides, for
 * basecamp and preview builds only (page.lab.tsx is a route only where next.config.ts adds the
 * extension, like /lab/; never in live builds or the sitemap).
 */
export const metadata: Metadata = {
  title: terrainLab.meta.title,
  description: terrainLab.meta.description,
  robots: { index: false, follow: false },
};

export default function TerrainLabPage() {
  return (
    <main id="main" className={`${styles.main} container`}>
      <header className={styles.header} data-quiet-zone>
        <h1 className={`${styles.title} display`}>{terrainLab.heading}</h1>
        <p className="body-copy">{terrainLab.intro}</p>
      </header>
      <TerrainLab />
    </main>
  );
}
