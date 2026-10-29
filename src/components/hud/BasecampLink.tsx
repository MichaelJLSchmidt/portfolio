"use client";

import { usePathname } from "next/navigation";
import { MorphSwitch } from "@/components/transition/MorphSwitch";
import { SignatureLink } from "@/components/motion/SignatureLink";
import { BASECAMP_MORPH } from "@/lib/morph";

const BASECAMP = "/about/";
const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

/**
 * The HUD's Basecamp link, one half of a shared element with the Basecamp H1 (MorphTarget on
 * /about/): going there the link grows into the heading, which settles once it has landed;
 * coming back the heading shrinks into the bar again.
 *
 * The HUD stays mounted across routes, so the shared name follows the pathname: everywhere but
 * /about/ the link sits in a <ViewTransition> of that name, on /about/ it renders without one.
 * Exactly one element holds the name in every state (two would abort the transition), and React
 * sees the link's boundary leave as the heading's arrives (and the other way round), the pair it
 * needs to start the morph. No inline name here: the HUD is never hidden in Next's page cache.
 */
export function BasecampLink({ label, className }: { label: string; className?: string }) {
  const pathname = usePathname();
  const here = withSlash(pathname ?? "") === BASECAMP;
  const link = <SignatureLink href={BASECAMP} variant="nav" label={label} current={here} className={className} />;
  if (here) return link;
  return (
    <MorphSwitch name={BASECAMP_MORPH} share="morph morph-title">
      {link}
    </MorphSwitch>
  );
}
