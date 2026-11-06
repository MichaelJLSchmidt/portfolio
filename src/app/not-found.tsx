import type { Metadata } from "next";
import { ActionLinks } from "@/components/home/ActionLinks";
import { WeightTitle } from "@/components/type/WeightTitle";
import { site } from "@/content/site";
import styles from "./not-found.module.css";

export const metadata: Metadata = { title: site.notFound.title };

export default function NotFound() {
  const t = site.notFound;
  return (
    <main id="main" className={`${styles.main} container`}>
      <p className={`${styles.eyebrow} hud-label map-halo`}>{t.eyebrow}</p>
      <WeightTitle as="h1" text={t.heading} arrive="load" className={styles.heading} />
      <p className={`${styles.line} knockout`}>{t.body}</p>
      <ActionLinks links={[{ label: t.back, href: "/", arrow: "←", arrowAt: "start", primary: true }]} />
    </main>
  );
}
