import type { Action } from "@/content/about";
import { asset } from "@/lib/asset";
import styles from "./Actions.module.css";

/** Contact actions. Until a URL exists, an action shows as a visible, inert [PLACEHOLDER]. */
export function Actions({ actions, className, exitOnReturn = false }: { actions: Action[]; className?: string; exitOnReturn?: boolean }) {
  return (
    <ul className={className ? `${styles.actions} ${className}` : styles.actions} data-vt-exit={exitOnReturn ? "" : undefined}>
      {actions.map((a, i) => (
        <li key={a.kind}>
          {a.href ? (
            <a
              className={styles.action}
              data-primary={i === 0 ? "true" : undefined}
              href={a.href.startsWith("/") ? asset(a.href) : a.href}
              {...(a.kind === "cv" ? { download: "" } : {})}
              {...(a.kind === "linkedin" ? { rel: "me noopener", target: "_blank" } : {})}
            >
              {a.label}
            </a>
          ) : (
            <span className={styles.action} data-placeholder="true">
              {a.label} <span className={styles.tbd}>[URL]</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
