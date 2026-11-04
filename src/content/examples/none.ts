import type { CardData } from "@/content/cards";
import type { CaseStudy } from "@/lib/case-study";

/** Stands in for ./index, ./case-studies and ./terrains in builds without examples (live; next.config.ts). */
export const exampleCards: CardData[] = [];
export const exampleTerrains: Record<string, unknown> = {};
export const exampleMedia: Record<string, string> = {};
export const exampleCaseStudies: Record<string, CaseStudy> = {};
