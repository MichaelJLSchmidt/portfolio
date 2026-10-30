import type { ReactNode } from "react";
import { SignatureLink } from "@/components/motion/SignatureLink";
import type { Action } from "@/content/contact";
import styles from "./Home.module.css";

export type ActionLink = { label: string; href: string | null; arrow?: string; arrowAt?: "start" | "end"; primary?: boolean; kind?: Action["kind"] };

/**
 * A row of action links drawn as pills (signature links: the label breathes on hover and focus,
 * a commit glints). A link without a URL yet shows as a visible, inert placeholder.
 */
export function ActionLinks({
  links,
  label,
  className,
  after,
}: {
  links: ActionLink[];
  label?: string;
  className?: string;
  /** An extra item after the link of a kind (the contact band's "Copy address" after Email). */
  after?: Partial<Record<Action["kind"], ReactNode>>;
}) {
  return (
    <ul className={className ? `${styles.actions} ${className}` : styles.actions} aria-label={label}>
      {links.flatMap((l) => [
        <li key={l.label}>
          {l.href ? (
            <SignatureLink
              href={l.href}
              variant="standalone"
              label={l.label}
              arrow={l.arrow}
              arrowAt={l.arrowAt}
              className={styles.action}
              data-primary={l.primary ? "" : undefined}
              {...(l.kind === "linkedin" ? { rel: "me noopener", target: "_blank" } : {})}
            />
          ) : (
            <span className={styles.action} data-placeholder="">
              {l.label} <span className={styles.tbd}>[URL]</span>
            </span>
          )}
        </li>,
        ...(l.kind && after?.[l.kind] ? [<li key={`${l.label}+`}>{after[l.kind]}</li>] : []),
      ])}
    </ul>
  );
}
