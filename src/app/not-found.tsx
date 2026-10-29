import Link from "next/link";
import { SettleText } from "@/components/motion/SettleText";
import { site } from "@/content/site";
import styles from "./not-found.module.css";

export default function NotFound() {
  const t = site.notFound;
  return (
    <main id="main" className={`${styles.main} container`}>
      <p className={`${styles.eyebrow} hud-label map-halo`}>{t.eyebrow}</p>
      <SettleText as="h1" text={t.heading} className={`${styles.heading} display`} shine />
      <p className="map-halo">{t.body}</p>
      <Link href="/" className={`${styles.back} hud-label`}>
        <span aria-hidden="true">←</span> {t.back}
      </Link>
    </main>
  );
}
