import Link from "next/link";
import { KineticText } from "@/components/type/KineticText";
import { site } from "@/content/site";
import styles from "./not-found.module.css";

export default function NotFound() {
  const t = site.notFound;
  return (
    <main id="main" className={`${styles.main} container`}>
      <p className={`${styles.eyebrow} hud-label map-halo`}>{t.eyebrow}</p>
      <KineticText as="h1" text={t.heading} className={`${styles.heading} display`} proximity />
      <p className="map-halo">{t.body}</p>
      <Link href="/" className={`${styles.back} hud-label`}>
        <span aria-hidden="true">←</span> {t.back}
      </Link>
    </main>
  );
}
