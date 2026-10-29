import { exampleCaseStudies } from "@/content/examples/case-studies";
import type { CaseStudy } from "@/lib/case-study";

/**
 * Case-study pages (/work/<slug>/), keyed by card slug. Only the case-study page reads this
 * module, so the long-form copy never ships with the deck. The building blocks are described in
 * src/lib/case-study.ts; src/content/examples/test-project shows every one of them in use.
 * [PLACEHOLDERS] mark facts still to confirm.
 *
 * No real case study is written yet: a live build (no flagged examples) has none, and the deck
 * and /work/ say so cleanly (see src/app/work/[slug]/page.tsx).
 */
const projectCaseStudies: Record<string, CaseStudy> = {};

/** Every case study in this build: the projects, then the flagged examples where included. */
export const caseStudies: Record<string, CaseStudy> = { ...projectCaseStudies, ...exampleCaseStudies };
