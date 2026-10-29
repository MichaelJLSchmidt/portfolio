import { SignatureLink } from "@/components/motion/SignatureLink";
import type { Action } from "@/content/contact";
import { asset } from "@/lib/asset";
import styles from "./Home.module.css";

export type ActionLink = { label: string; href: string | null; arrow?: string; primary?: boolean; kind?: Action["kind"] };

/**
 * A row of action links drawn as pills (signature links: the label breathes on hover and focus,
 * a commit glints). A link without a URL yet (the CV) shows as a visible, inert placeholder.
 */
export function ActionLinks({ links, label, className }: { links: ActionLink[]; label?: string; className?: string }) {
  return (
    <ul className={className ? `${styles.actions} ${className}` : styles.actions} aria-label={label}>
      {links.map((l) => (
        <li key={l.label}>
          {l.href ? (
            <SignatureLink
              href={l.href.startsWith("/") && !l.href.startsWith("/#") && l.kind === "cv" ? asset(l.href) : l.href}
              variant="standalone"
              label={l.label}
              arrow={l.arrow}
              className={styles.action}
              data-primary={l.primary ? "" : undefined}
              {...(l.kind === "cv" ? { download: "" } : {})}
              {...(l.kind === "linkedin" ? { rel: "me noopener", target: "_blank" } : {})}
            />
          ) : (
            <span className={styles.action} data-placeholder="">
              {l.label} <span className={styles.tbd}>[URL]</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
