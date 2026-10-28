"use client";

import Link from "next/link";
import { useRef, type ComponentProps, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { haptic } from "@/lib/haptics";
import { duration, levels, stagger, staggerStep } from "@/styles/tokens";
import { Glint } from "./Glint";
import { playGlint } from "./glint";
import styles from "./SignatureLink.module.css";

export type SignatureLinkVariant = "inline" | "standalone" | "display" | "nav";

export type SignatureLinkProps = Omit<ComponentProps<typeof Link>, "children"> & {
  /**
   * inline: a contour underline draws and the colour moves to glacier (a phrase in running text);
   * standalone: label letters breathe wider left to right and the arrow nudges;
   * display: the same on display type;
   * nav: the breath plus a current state (`current`).
   */
  variant: SignatureLinkVariant;
  /** The link text (the letters that breathe). */
  label: string;
  /** Content before the label, e.g. an eyebrow line; part of the link's name. */
  before?: ReactNode;
  /** A decorative arrow after the label (standalone and display), nudged on hover or focus. */
  arrow?: string;
  /** nav: this is the current page (aria-current="page"). */
  current?: boolean;
  /** Class for the label (type style). */
  labelClassName?: string;
  /** "sheet" on the light sheet: the commit draws a moss-ink rule instead of the glint. */
  surface?: "dark" | "sheet";
};

/**
 * The signature link. Hover (fine pointers only, under `(hover: hover)`) and keyboard focus get
 * exactly the same motion; press narrows the weight; committing (click, Enter or tap) plays the
 * glint as navigation starts, with a haptic tick where supported. The label sits in a box reserved
 * at its widest (breath) state, so a breath never moves anything. Still mode keeps the colour
 * change only; calm keeps the breath but never glints. docs/motion.md has the details.
 */
export function SignatureLink({
  variant,
  label,
  before,
  arrow,
  current = false,
  labelClassName,
  surface = "dark",
  className,
  onClick,
  style,
  ...props
}: SignatureLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const letters = [...label];
  const n = letters.length;
  // The ripple fits the response budget going in, and the 240 ms settle coming back.
  const stepIn = staggerStep({ step: stagger.char.step, cap: levels.response.maxMs - duration.breath }, n);
  const stepOut = staggerStep({ step: stagger.char.step, cap: duration.breathOut - duration.breath }, n);

  const commit = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0) return;
    haptic("commit");
    playGlint(ref.current);
  };

  const vars = { ...style, "--l-n": n, "--l-in": `${stepIn}ms`, "--l-out": `${stepOut}ms` } as CSSProperties;
  const classes = [styles.link, className].filter(Boolean).join(" ");

  if (variant === "inline") {
    return (
      <Link ref={ref} {...props} className={classes} data-variant="inline" style={style} onClick={commit}>
        {before}
        <span className={styles.phrase}>
          {label}
          <Glint text={label} surface={surface} />
        </span>
      </Link>
    );
  }

  return (
    <Link
      ref={ref}
      {...props}
      className={classes}
      data-variant={variant}
      aria-current={variant === "nav" && current ? "page" : undefined}
      style={vars}
      onClick={commit}
    >
      {before}
      <span className={labelClassName ? `${styles.label} ${labelClassName}` : styles.label}>
        <span className="visually-hidden">{label}</span>
        {/* Holds the box at the breath axes (plus the arrow's nudge). */}
        <span className={styles.ghost} aria-hidden="true">
          {label}
          {arrow && <span className={styles.arrow}>{arrow}</span>}
        </span>
        <span className={styles.run} aria-hidden="true">
          <span className={styles.word}>
            {letters.map((ch, i) => (
              <span key={i} className={styles.ch} style={{ "--kt-i": i } as CSSProperties}>
                {ch}
              </span>
            ))}
            <Glint text={label} surface={surface} className={styles.glint} />
          </span>
          {arrow && <span className={styles.arrow}>{arrow}</span>}
        </span>
      </span>
    </Link>
  );
}
