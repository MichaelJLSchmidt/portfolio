"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { SettleText } from "@/components/motion/SettleText";
import { widestEm } from "@/lib/display-width";
import { nameLines } from "@/lib/name-lines";

// Dev and preview builds only: ?name=… shows the hero with another name, to check the layout
// for other lengths. Production builds compile it out.
const previewable = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_PREVIEW === "1";
const noop = () => () => {};
const readOverride = () => new URLSearchParams(window.location.search).get("name")?.trim() || null;
const none = () => null;

/**
 * The hero's display name, on at most two lines. The hero has one display size: the site name's
 * longest line, measured (--name-em), fills its measure. A shorter name (a ?name= preview) keeps
 * that size; only a longer one scales itself down (--fit-em). Every letter's box takes its
 * measured width, so the web font replacing the fallback moves nothing.
 */
export function HeroName({ name, className }: { name: string; className?: string }) {
  const override = useSyncExternalStore(noop, previewable ? readOverride : none, none);
  const lines = nameLines(override ?? name);
  return (
    <SettleText
      as="h1"
      id="hero-name"
      text={lines.join("\n")}
      className={className}
      shine
      glint
      quiet
      widths="display"
      style={{ "--name-em": widestEm(nameLines(name).join("\n"), { lines: true }), "--fit-em": widestEm(lines.join("\n"), { lines: true }) } as CSSProperties}
    />
  );
}
