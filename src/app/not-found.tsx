import Link from "next/link";
import { site } from "@/content/site";
import styles from "./not-found.module.css";

export default function NotFound() {
  const t = site.notFound;
  return (
    <main id="main" className={styles.main}>
      <p className={`${styles.eyebrow} hud-label map-halo`}>{t.eyebrow}</p>
      <h1 className={`${styles.heading} display`}>{t.heading}</h1>
      <p className="map-halo">{t.body}</p>
      <Link href="/" className={`${styles.back} hud-label`}>
        <span aria-hidden="true">←</span> {t.back}
      </Link>
    </main>
  );
}
