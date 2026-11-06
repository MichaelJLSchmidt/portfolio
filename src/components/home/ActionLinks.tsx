import type { ReactNode } from "react";
import { TrailLink } from "@/components/interaction/TrailLink";
import type { Action } from "@/content/contact";
import styles from "./Home.module.css";

export type ActionLink = { label: string; href: string | null; arrow?: string; arrowAt?: "start" | "end"; primary?: boolean; kind?: Action["kind"] };

/**
 * A row of trail links. A link without a URL yet shows as a visible, inert placeholder.
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
            <TrailLink
              href={l.href}
              plain={!l.href.startsWith("/")}
              arrow={l.arrow ?? null}
              arrowAt={l.arrowAt}
              className={styles.action}
              data-primary={l.primary ? "" : undefined}
              {...(l.kind === "linkedin" ? { rel: "me noopener", target: "_blank" } : {})}
            >
              {l.label}
            </TrailLink>
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
