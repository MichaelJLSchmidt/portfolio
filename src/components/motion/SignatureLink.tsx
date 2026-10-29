"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, type ComponentProps, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { haptic } from "@/lib/haptics";
import { isSettled, markSettled, settleKey } from "@/lib/settled";
import { duration, levels, stagger, staggerStep } from "@/styles/tokens";
import { Glint } from "./Glint";
import { playGlint } from "./glint";
import styles from "./SignatureLink.module.css";

export type SignatureLinkVariant = "inline" | "standalone" | "display" | "nav" | "chip";

export type SignatureLinkProps = Omit<ComponentProps<typeof Link>, "children"> & {
  /**
   * inline: a contour underline draws and the colour moves to glacier (a phrase in running text);
   * standalone: label letters breathe wider left to right and the arrow nudges;
   * display: the same on display type;
   * nav: the breath plus a current state (`current`);
   * chip: a pill whose label breathes and whose border brightens; pressed or current, it fills
   * with the sheet colour.
   */
  variant: SignatureLinkVariant;
  /**
   * The letters' axes: label (Archivo, the default), mono (Martian Mono: HUD and eyebrow-style
   * links) or display (the display variant's own).
   */
  role?: "label" | "mono" | "display";
  /** The link text (the letters that breathe). */
  label: string;
  /** Content before the label, e.g. an eyebrow line; part of the link's name. */
  before?: ReactNode;
  /** A decorative arrow after the label (standalone and display), nudged on hover or focus. */
  arrow?: string;
  /** "start": the arrow comes before the label and nudges back (back links, "← All expeditions"). */
  arrowAt?: "start" | "end";
  /**
   * nav and chip: the current page (true or "page": aria-current="page"), or the current place
   * within a section ("location", e.g. Expeditions on a case study, the waypoint being read).
   */
  current?: boolean | "page" | "location";
  /**
   * The label's letters settle from the role's reveal axes at first paint, once per session (the
   * HUD's links). The box stays reserved at the breath axes; the letters lie over it.
   */
  settle?: boolean;
  /** Class for the label (type style). */
  labelClassName?: string;
  /** "sheet" on the light sheet: the commit draws a moss-ink rule instead of the glint. */
  surface?: "dark" | "sheet";
  /** A plain <a> instead of next/link: files and downloads (the CV), which are not routes. */
  plain?: boolean;
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
  role = variant === "display" ? "display" : "label",
  label,
  before,
  arrow,
  arrowAt = "end",
  current = false,
  settle = false,
  labelClassName,
  surface = "dark",
  plain = false,
  className,
  onClick,
  style,
  ...props
}: SignatureLinkProps) {
  const Anchor = (plain ? "a" : Link) as typeof Link;
  const ref = useRef<HTMLAnchorElement>(null);
  const key = settleKey("", `link:${label}`);

  // The first-paint settle (CSS) is remembered once it has landed; a link mounted later in a
  // session that already saw it renders at rest.
  useLayoutEffect(() => {
    const el = ref.current;
    if (settle && el && isSettled(key)) el.setAttribute("data-settle", "done");
  }, [settle, key]);
  useEffect(() => {
    const el = ref.current;
    if (!settle || !el || el.getAttribute("data-settle") !== "true") return;
    let live = true;
    const running = el.getAnimations({ subtree: true }).filter((a) => /sl-settle/.test((a as CSSAnimation).animationName ?? ""));
    const done = () => {
      if (!live) return;
      el.setAttribute("data-settle", "done");
      markSettled(key);
    };
    if (!running.length) done();
    else Promise.all(running.map((a) => a.finished)).then(done, done);
    return () => {
      live = false;
    };
  }, [settle, key]);
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

  // The settle cascade fits the char stagger's cap.
  const stepSettle = staggerStep(stagger.char, n);
  const vars = { ...style, "--l-n": n, "--l-in": `${stepIn}ms`, "--l-out": `${stepOut}ms`, "--l-settle": `${stepSettle}ms` } as CSSProperties;
  const currentValue = current === true ? "page" : current || undefined;
  const classes = [styles.link, className].filter(Boolean).join(" ");

  if (variant === "inline") {
    return (
      <Anchor ref={ref} {...props} className={classes} data-variant="inline" style={style} onClick={commit}>
        {before}
        <span className={styles.phrase}>
          {label}
          <Glint text={label} surface={surface} />
        </span>
      </Anchor>
    );
  }

  return (
    <Anchor
      ref={ref}
      {...props}
      className={classes}
      data-variant={variant}
      data-role={role}
      data-arrow={arrow ? arrowAt : undefined}
      data-settle={settle ? "true" : undefined}
      data-settle-key={settle ? key : undefined}
      aria-current={variant === "nav" || variant === "chip" ? currentValue : undefined}
      style={vars}
      onClick={commit}
    >
      {before}
      <span className={labelClassName ? `${styles.label} ${labelClassName}` : styles.label}>
        <span className="visually-hidden">{label}</span>
        {/* Holds the box at the breath axes (plus the arrow's nudge). */}
        <span className={styles.ghost} aria-hidden="true">
          {arrow && arrowAt === "start" && <span className={styles.arrow}>{arrow}</span>}
          {label}
          {arrow && arrowAt === "end" && <span className={styles.arrow}>{arrow}</span>}
        </span>
        <span className={styles.run} aria-hidden="true">
          {arrow && arrowAt === "start" && <span className={styles.arrow}>{arrow}</span>}
          <span className={styles.word}>
            {letters.map((ch, i) => (
              <span key={i} className={styles.ch} style={{ "--kt-i": i } as CSSProperties}>
                {ch}
              </span>
            ))}
            <Glint text={label} surface={surface} className={styles.glint} />
          </span>
          {arrow && arrowAt === "end" && <span className={styles.arrow}>{arrow}</span>}
        </span>
      </span>
    </Anchor>
  );
}
