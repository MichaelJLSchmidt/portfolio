import { ActionLinks } from "@/components/home/ActionLinks";
import { SettleText } from "@/components/motion/SettleText";
import { site } from "@/content/site";
import styles from "./not-found.module.css";

export default function NotFound() {
  const t = site.notFound;
  return (
    <main id="main" className={`${styles.main} container`}>
      <p className={`${styles.eyebrow} hud-label map-halo`}>{t.eyebrow}</p>
      <SettleText as="h1" text={t.heading} className={`${styles.heading} display`} shine />
      <p className={`${styles.line} knockout`}>{t.body}</p>
      <ActionLinks links={[{ label: t.back, href: "/", primary: true }]} />
    </main>
  );
}
