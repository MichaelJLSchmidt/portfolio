// The case-study template's schema: every example is complete, and an incomplete case study is
// rejected with a reason. `npm test` (with scripts/lib/ts-hooks.mjs for the "@/…" imports).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { exampleCaseStudies } from "../content/examples/case-studies.ts";
import { validateCaseStudy, type CaseStudy } from "./case-study.ts";

describe("case-study schema", () => {
  for (const [slug, study] of Object.entries(exampleCaseStudies)) {
    it(`${slug} is complete`, () => assert.deepEqual(validateCaseStudy(slug, study), []));
  }

  const base = Object.values(exampleCaseStudies)[0];
  const broken = (change: (s: CaseStudy) => void) => {
    const copy = structuredClone(base);
    change(copy);
    return validateCaseStudy("broken", copy);
  };

  it("rejects five stages", () => assert.ok(broken((s) => s.stages.pop()).some((e) => /six stages/.test(e))));
  it("rejects a summary without its outcome", () => assert.ok(broken((s) => (s.summary.outcome = [])).some((e) => /outcome/.test(e))));
  it("rejects a reversed decision without its date", () =>
    assert.ok(broken((s) => s.reversedDecision.options.forEach((o) => o.turnedBack && (o.turnedBack.date = ""))).some((e) => /turned back/.test(e))));
  it("rejects a lesson without what I would do next time", () =>
    assert.ok(broken((s) => (s.lookingBack[0].nextTime = "Maybe.")).some((e) => /Next time I would/.test(e))));
  it("rejects a result without the stage it was won at", () => assert.ok(broken((s) => (s.results.rows[0].stage = 0)).some((e) => /stage/.test(e))));
  it("rejects a decision with two chosen options", () =>
    assert.ok(broken((s) => s.reversedDecision.options.forEach((o) => (o.status = "chosen"))).some((e) => /exactly one chosen/.test(e))));
  it("rejects a problem of one sentence", () => assert.ok(broken((s) => (s.problem = "Too short.")).some((e) => /problem/.test(e))));
});
