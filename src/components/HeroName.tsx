"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { SettleText } from "@/components/motion/SettleText";
import { nameLines } from "@/lib/name-lines";

// Dev and preview builds only: ?name=… shows the hero with another name, to check the layout
// for other lengths. Production builds compile it out.
const previewable = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_PREVIEW === "1";
const noop = () => () => {};
const readOverride = () => new URLSearchParams(window.location.search).get("name")?.trim() || null;
const none = () => null;

/** The hero's display name, on at most two lines, sized by its longest line (--name-chars). */
export function HeroName({ name, className }: { name: string; className?: string }) {
  const override = useSyncExternalStore(noop, previewable ? readOverride : none, none);
  const lines = nameLines(override ?? name);
  const chars = Math.max(...lines.map((l) => l.length));
  return (
    <SettleText
      as="h1"
      id="hero-name"
      text={lines.join("\n")}
      className={className}
      shine
      glint
      quiet
      style={{ "--name-chars": chars } as CSSProperties}
    />
  );
}
