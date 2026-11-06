"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { haptic } from "@/lib/haptics";
import styles from "./Hud.module.css";

/**
 * A navigation link in the HUD: mono label, glacier on hover and focus, and while it marks the
 * current page (`current`: aria-current="page") or the current place (`"location"`: Work while a
 * case study is open) a short glacier rule under it. A commit ticks the commit haptic.
 */
export function HudLink({ href, label, current = false, className }: { href: string; label: string; current?: boolean | "location"; className?: string }) {
  return (
    <Link
      href={href}
      className={className ? `${styles.navLink} ${className}` : styles.navLink}
      aria-current={current === true ? "page" : current || undefined}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (e.button === 0 && !e.metaKey && !e.ctrlKey) haptic("commit");
      }}
    >
      {label}
    </Link>
  );
}
