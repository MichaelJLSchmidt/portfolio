"use client";

import { usePathname } from "next/navigation";
import { SignatureLink } from "@/components/motion/SignatureLink";

const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

/** Work: the cards on the home page (/#work); marked as the current place while a case study is open. */
export function WorkLink({ label, className }: { label: string; className?: string }) {
  const pathname = usePathname();
  const inCaseStudy = withSlash(pathname ?? "").startsWith("/work/");
  return <SignatureLink href="/#work" variant="nav" role="mono" settle label={label} current={inCaseStudy ? "location" : false} className={className} />;
}
