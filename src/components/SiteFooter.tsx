import { site } from "@/content/site";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <p className="hud-label">
        <a href={site.footer.creditHref} rel="noopener">
          {site.footer.credit}
        </a>
      </p>
      <p className={`${styles.note} hud-label`}>{site.footer.note}</p>
    </footer>
  );
}
