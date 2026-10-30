import { SignatureLink } from "@/components/motion/SignatureLink";
import type { Action } from "@/content/contact";
import { asset } from "@/lib/asset";

/**
 * The CV (a PDF): a plain download link, since it is a file, not a route (a signature link drawn
 * as a plain anchor). Until the file exists (`href: null`) it shows as a visible, inert
 * placeholder, like the contact actions.
 */
export function CvLink({
  cv,
  label,
  className,
  placeholderClassName,
  inline = false,
}: {
  cv: Action;
  label: string;
  className?: string;
  placeholderClassName?: string;
  /** The footer's form: an inline link. */
  inline?: boolean;
}) {
  if (!cv.href) {
    return (
      <span className={placeholderClassName ?? className} data-placeholder="true">
        {label} <span aria-hidden="true">[URL]</span>
      </span>
    );
  }
  const href = cv.href.startsWith("/") ? asset(cv.href) : cv.href;
  return inline ? (
    <SignatureLink plain href={href} download="" variant="inline" label={label} className={className} />
  ) : (
    <SignatureLink plain href={href} download="" variant="nav" role="mono" settle label={label} className={className} />
  );
}
