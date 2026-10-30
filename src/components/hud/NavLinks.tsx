"use client";

import { usePathname } from "next/navigation";
import { HudLink } from "./HudLink";

const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

/** Work: the cards on the home page (/#work); marked as the current place while a case study is open. */
export function WorkLink({ label, className }: { label: string; className?: string }) {
  const pathname = usePathname();
  const inCaseStudy = withSlash(pathname ?? "").startsWith("/work/");
  return <HudLink href="/#work" label={label} current={inCaseStudy ? "location" : false} className={className} />;
}
