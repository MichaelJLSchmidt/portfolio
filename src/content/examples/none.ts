import type { SummitCardData } from "@/content/cards";
import type { CaseStudy } from "@/lib/case-study";

/** Stands in for ./index and ./case-studies in builds without examples (live; next.config.ts). */
export const exampleCards: SummitCardData[] = [];
export const exampleTerrains: Record<string, unknown> = {};
export const exampleMedia: Record<string, string> = {};
export const exampleCaseStudies: Record<string, CaseStudy> = {};
