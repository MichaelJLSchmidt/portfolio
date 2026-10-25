import { exampleCaseStudies } from "@/content/examples/case-studies";
import type { CaseStudy } from "@/lib/case-study";

/**
 * Case-study pages (/work/<slug>/), keyed by card slug. Only the case-study page reads this
 * module, so the long-form copy never ships with the deck. The building blocks are described in
 * src/lib/case-study.ts; src/content/examples/test-project shows every one of them in use.
 * [PLACEHOLDERS] mark facts still to confirm.
 */
const projectCaseStudies: Record<string, CaseStudy> = {
  kibon: {
    lede: "[LEDE] Planning and designing the second generation of the Canton of Bern's childcare-subsidy platform.",
    summary: {
      problem: "[PROBLEM]",
      role: "UX designer and workshop moderator — [ROLE DETAILS]",
      team: "[#]",
      duration: "[#] months",
      reach: "[#]",
      keyDecision: "[KEY DECISION]",
      outcome: "[OUTCOME]",
    },
    waypoints: [
      { id: "context", nav: "Context", label: "Context", finding: "[FINDING]", blocks: [{ kind: "p", text: "[CONTEXT]" }] },
      {
        id: "story-mapping",
        nav: "User Story Mapping",
        label: "User Story Mapping",
        finding: "[FINDING]",
        blocks: [{ kind: "p", text: "[STORY MAPPING]" }],
      },
      {
        id: "validation",
        nav: "Validation workshop",
        label: "Validation workshop",
        finding: "[FINDING]",
        blocks: [{ kind: "p", text: "[VALIDATION WORKSHOP]" }],
      },
      { id: "outcome", nav: "Outcome", label: "Outcome", finding: "[FINDING]", blocks: [{ kind: "p", text: "[OUTCOME DETAILS]" }] },
    ],
  },
};

/** Every case study in this build: the projects, then the flagged examples where included. */
export const caseStudies: Record<string, CaseStudy> = { ...projectCaseStudies, ...exampleCaseStudies };
