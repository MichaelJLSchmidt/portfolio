import Link from "next/link";
import { site } from "@/content/site";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={`${styles.footer} knockout`}>
      <p className="hud-label">
        <a href={site.footer.creditHref} rel="noopener">
          {site.footer.credit}
        </a>
      </p>
      <p className="hud-label">
        <Link href="/about/">{site.footer.about}</Link>
      </p>
      <p className="hud-label">{site.footer.note}</p>
    </footer>
  );
}
