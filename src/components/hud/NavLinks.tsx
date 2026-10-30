"use client";

import { usePathname } from "next/navigation";
import { SignatureLink } from "@/components/motion/SignatureLink";

const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

/** Expeditions: the deck on the home page; marked as the current place while a case study is open. */
export function ExpeditionsLink({ label, className, inline = false }: { label: string; className?: string; inline?: boolean }) {
  const pathname = usePathname();
  const inExpedition = withSlash(pathname ?? "").startsWith("/work/");
  if (inline) return <SignatureLink href="/#expeditions" variant="inline" label={label} className={className} />;
  return <SignatureLink href="/#expeditions" variant="nav" role="mono" settle label={label} current={inExpedition ? "location" : false} className={className} />;
}

/** Contact: the contact band on the page itself on Basecamp (it has one), the home page's elsewhere. */
export function ContactLink({ label, className, inline = false }: { label: string; className?: string; inline?: boolean }) {
  const pathname = usePathname();
  const href = withSlash(pathname ?? "") === "/about/" ? "#contact" : "/#contact";
  if (inline) return <SignatureLink href={href} variant="inline" label={label} className={className} />;
  return <SignatureLink href={href} variant="nav" role="mono" settle label={label} className={className} />;
}
