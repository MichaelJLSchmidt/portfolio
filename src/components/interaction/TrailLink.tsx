"use client";

import Link from "next/link";
import { useEffect, useRef, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { haptic } from "@/lib/haptics";
import styles from "./TrailLink.module.css";

const BLAZED = "summit:blazed";

function blazed(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(BLAZED) ?? "[]");
  } catch {
    return [];
  }
}

function blaze(key: string) {
  try {
    const list = blazed();
    if (!list.includes(key)) sessionStorage.setItem(BLAZED, JSON.stringify([...list, key]));
  } catch {
    // Without storage the blaze shows for this page view only (the attribute below).
  }
}

export type TrailLinkProps = Omit<ComponentProps<typeof Link>, "children"> & {
  /** The link text. */
  children: ReactNode;
  /**
   * "standalone": a link on its own line, with an arrow that steps forward on hover and focus;
   * "inline": a phrase in running text, the same line without the arrow.
   */
  variant?: "standalone" | "inline";
  /** The arrow (standalone): "→" by default; "start" puts it first and steps it back (back links). */
  arrow?: string | null;
  arrowAt?: "start" | "end";
  /** A plain <a> instead of next/link: mail, external sites, files. */
  plain?: boolean;
};

/**
 * The trail link. At rest a dotted underline at 40% opacity; on hover and keyboard focus a solid
 * signal-red line draws left to right (--dur-trail, 280 ms) and the arrow steps forward 3 px in
 * two steps. A committed click leaves a small white-red-white blaze beside it for the rest of the
 * session (a data attribute from sessionStorage, not :visited), and ticks the commit haptic (a
 * jump within the page: the detent). Calm draws in 120 ms; still changes at once. Red is the
 * route's colour: trail links, the route and its blaze only. TrailLink.module.css has the look.
 */
export function TrailLink({ children, variant = "standalone", arrow = "→", arrowAt = "end", plain = false, className, onClick, href, ...props }: TrailLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const key = typeof href === "string" ? href : (href.pathname ?? "");
  const Anchor = (plain ? "a" : Link) as typeof Link;
  const extra = !plain && key.startsWith("#") ? { prefetch: false } : {};

  useEffect(() => {
    if (blazed().includes(key)) ref.current?.setAttribute("data-blazed", "");
  }, [key]);

  const commit = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0) return;
    const a = e.currentTarget;
    const jump = !plain && a.origin === window.location.origin && a.pathname === window.location.pathname && !!a.hash;
    haptic(jump ? "detent" : "commit");
    blaze(key);
    a.setAttribute("data-blazed", "");
  };

  const arrowEl = variant === "standalone" && arrow ? (
    <span className={styles.arrow} aria-hidden="true">
      {arrow}
    </span>
  ) : null;
  return (
    <Anchor
      ref={ref}
      href={href}
      {...extra}
      {...props}
      className={className ? `${styles.link} ${className}` : styles.link}
      data-trail={variant}
      data-arrow-at={arrowEl ? arrowAt : undefined}
      onClick={commit}
    >
      {arrowAt === "start" && arrowEl}
      <span className={styles.label}>{children}</span>
      {arrowAt === "end" && arrowEl}
      <span className={styles.blaze} aria-hidden="true" />
    </Anchor>
  );
}
