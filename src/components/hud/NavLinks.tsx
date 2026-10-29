"use client";

import { usePathname } from "next/navigation";
import { SignatureLink } from "@/components/motion/SignatureLink";

const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

/** Contact: the contact band on the page itself on Basecamp (it has one), the home page's elsewhere. */
export function ContactLink({ label, className }: { label: string; className?: string }) {
  const pathname = usePathname();
  const href = withSlash(pathname ?? "") === "/about/" ? "#contact" : "/#contact";
  return <SignatureLink href={href} variant="nav" label={label} className={className} />;
}
