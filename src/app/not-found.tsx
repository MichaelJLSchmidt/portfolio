import type { Metadata } from "next";
import Link from "next/link";
import { Title } from "@/components/type/Title";
import { site } from "@/content/site";
import styles from "./not-found.module.css";

export const metadata: Metadata = { title: site.notFound.title };

/** 404: "Off the map", and the way back to the case studies. */
export default function NotFound() {
  const t = site.notFound;
  return (
    <main id="main" className={`${styles.main} container`}>
      <p className={`${styles.eyebrow} mono`}>{t.eyebrow}</p>
      <Title role="h1" text={t.heading} />
      <Link href="/#case-studies" className="cta">
        <span data-arrow="" aria-hidden="true">
          ←
        </span>
        {t.back}
      </Link>
    </main>
  );
}
