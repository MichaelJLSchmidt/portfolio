import type { Metadata } from "next";
import { LabFrames } from "@/components/lab/LabFrames";
import { lab } from "@/content/lab";
import styles from "@/components/lab/Lab.module.css";

/**
 * The motion lab: a review page for basecamp and preview builds only (page.lab.tsx is a route only
 * where next.config.ts adds the extension; never in live builds or the sitemap).
 */
export const metadata: Metadata = {
  title: lab.meta.title,
  description: lab.meta.description,
  robots: { index: false, follow: false },
};

export default function MotionLab() {
  return (
    <main id="main" className={`${styles.main} container`}>
      <header className={styles.header}>
        <h1 className={`${styles.title} display`}>{lab.heading}</h1>
        <p className="body-copy">{lab.intro}</p>
      </header>
      <LabFrames />
    </main>
  );
}
