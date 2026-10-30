"use client";

import { usePathname } from "next/navigation";
import { MorphSwitch } from "@/components/transition/MorphSwitch";
import { HudLink } from "./HudLink";
import { ABOUT_MORPH } from "@/lib/morph";

const ABOUT = "/about/";
const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

/**
 * The HUD's About link, one half of a shared element with the About H1 (MorphTarget on /about/):
 * going there the label grows into the heading; coming back the heading shrinks into the bar
 * again.
 *
 * The HUD stays mounted across routes, so the shared name follows the pathname: everywhere but
 * /about/ the link sits in a <ViewTransition> of that name, on /about/ it renders without one.
 * Exactly one element holds the name in every state (two would abort the transition), and React
 * sees the link's boundary leave as the heading's arrives (and the other way round), the pair it
 * needs to start the morph. No inline name here: the HUD is never hidden in Next's page cache.
 */
export function AboutLink({ label, className }: { label: string; className?: string }) {
  const pathname = usePathname();
  const here = withSlash(pathname ?? "") === ABOUT;
  const link = <HudLink href={ABOUT} label={label} current={here} className={className} />;
  if (here) return link;
  return (
    <MorphSwitch name={ABOUT_MORPH} share="morph morph-title">
      {link}
    </MorphSwitch>
  );
}
