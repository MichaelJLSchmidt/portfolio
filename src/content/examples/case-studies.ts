import type { CaseStudy } from "@/lib/case-study";
import { caseStudy as gratweg } from "./gratweg/case-study";
import { caseStudy as seilschaft } from "./seilschaft/case-study";
import { caseStudy as testProject } from "./test-project/case-study";

/** The examples' case-study pages, by slug (see ./index.ts). Only the case-study page reads this. */
export const exampleCaseStudies: Record<string, CaseStudy> = { seilschaft, gratweg, "test-project": testProject };
