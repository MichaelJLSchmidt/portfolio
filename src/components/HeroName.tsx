"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { WeightTitle } from "@/components/type/WeightTitle";
import { flood } from "@/content/flood";
import { titleEm } from "@/lib/title-axes";
import { nameLines } from "@/lib/name-lines";

// Dev and preview builds only: ?name=… shows the hero with another name, to check the layout
// for other lengths. Production builds compile it out.
const previewable = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_PREVIEW === "1";
const noop = () => () => {};
const readOverride = () => new URLSearchParams(window.location.search).get("name")?.trim() || null;
const none = () => null;

/**
 * The hero's display name, on at most two lines: one WeightTitle that arrives from the first
 * frame (pure CSS). The hero has one display size: the site name's longest line, measured at the
 * rest cut (--name-em), fills its measure. A shorter name (a ?name= preview) keeps that size; only
 * a longer one scales itself down (--fit-em).
 */
export function HeroName({ name, className }: { name: string; className?: string }) {
  const override = useSyncExternalStore(noop, previewable ? readOverride : none, none);
  const lines = nameLines(override ?? name);
  return (
    <WeightTitle
      as="h1"
      id="hero-name"
      text={lines.join("\n")}
      arrive="load"
      flood={flood.heroName}
      className={className}
      style={{ "--name-em": titleEm(nameLines(name).join("\n")), "--fit-em": titleEm(lines.join("\n")) } as CSSProperties}
    />
  );
}
