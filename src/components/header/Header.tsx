"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { site } from "@/content/site";
import { distance } from "@/styles/tokens";
import styles from "./Header.module.css";

const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

/**
 * The header: the brand on the left, "Case studies · About · Contact" on the right in mono. The
 * current page (About) carries a 1 px mint underline. Transparent at the top; after 80 px of
 * scroll the ground at 85 % with an 8 px blur behind it (one passive scroll listener sets
 * data-solid; the colour fades over --dur-fast). The same links on phones, no menu; below 768 px
 * Contact is an envelope with its name for screen readers, so the bar fits at 320 px. It has its
 * own view-transition name and no animation, so it stays put while pages change.
 */
export function Header() {
  const pathname = withSlash(usePathname() ?? "/");
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let solid = false;
    const update = () => {
      const next = window.scrollY > distance.headerSolid;
      if (next !== solid) {
        solid = next;
        el.toggleAttribute("data-solid", next);
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const nav = site.nav;
  return (
    <header ref={ref} className={styles.header} data-vt-part="header">
      <div className={`${styles.bar} container`}>
        <Link href="/" className={`${styles.brand} plain`} aria-label={nav.home}>
          {site.brand}
        </Link>
        <nav aria-label={nav.label}>
          <ul className={styles.links}>
            <li>
              <Link href="/#case-studies" className={`${styles.link} mono plain`}>
                {nav.caseStudies}
              </Link>
            </li>
            <li>
              <Link href="/about/" className={`${styles.link} mono plain`} aria-current={pathname === "/about/" ? "page" : undefined}>
                {nav.about}
              </Link>
            </li>
            <li>
              <a href="#contact" className={`${styles.link} mono plain`} aria-label={nav.contact}>
                <span className={styles.wide} aria-hidden="true">
                  {nav.contact}
                </span>
                <svg className={styles.envelope} viewBox="0 0 20 20" aria-hidden="true">
                  <rect x="2.5" y="4.5" width="15" height="11" />
                  <path d="M2.5 5 10 11l7.5-6" />
                </svg>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
