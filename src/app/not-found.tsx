import { ActionLinks } from "@/components/home/ActionLinks";
import { SettleText } from "@/components/motion/SettleText";
import { site } from "@/content/site";
import styles from "./not-found.module.css";

export default function NotFound() {
  const t = site.notFound;
  return (
    <main id="main" className={`${styles.main} container`}>
      <SettleText as="p" text={t.eyebrow} mode="chars" role="mono" className={`${styles.eyebrow} hud-label map-halo`} />
      <SettleText as="h1" text={t.heading} className={`${styles.heading} display`} shine />
      <p className={`${styles.line} knockout`}>{t.body}</p>
      <ActionLinks links={[{ label: t.back, href: "/", arrow: "←", arrowAt: "start", primary: true }]} />
    </main>
  );
}
