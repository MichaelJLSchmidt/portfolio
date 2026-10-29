import type { Action } from "@/content/contact";
import { asset } from "@/lib/asset";

/**
 * The CV (a PDF): a plain download link, since it is a file, not a route. Until the file exists
 * (`href: null`) it shows as a visible, inert placeholder, like the contact actions.
 */
export function CvLink({ cv, label, className, placeholderClassName }: { cv: Action; label: string; className?: string; placeholderClassName?: string }) {
  if (!cv.href) {
    return (
      <span className={placeholderClassName ?? className} data-placeholder="true">
        {label} <span aria-hidden="true">[URL]</span>
      </span>
    );
  }
  return (
    <a className={className} href={cv.href.startsWith("/") ? asset(cv.href) : cv.href} download="">
      {label}
    </a>
  );
}
