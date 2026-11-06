import { ViewTransition, type ReactNode } from "react";

/**
 * A page's content in a page change (src/styles/transitions.css): the old page fades out, the new
 * one rises in; a case study ("case") fades in under the art's morph while its title, meta lines
 * and summary arrive in steps (their own view-transition names). The header, the backdrop and the
 * footer stay out of it: the header keeps its place, the field carries its own crossfade.
 */
export function PageTransition({ children, kind = "page" }: { children: ReactNode; kind?: "page" | "case" }) {
  return (
    <ViewTransition enter={kind === "case" ? "case-in" : "page-in"} exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
