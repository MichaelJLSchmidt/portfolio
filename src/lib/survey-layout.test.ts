// The Calm Survey template's mapping (src/lib/survey-layout.ts): every part of each example lands
// in exactly one slot, in the template's order, and nothing is invented. `npm test`.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { exampleCards } from "../content/examples/index.ts";
import { exampleCaseStudies } from "../content/examples/case-studies.ts";
import type { Block, CaseStudy } from "./case-study.ts";
import { pageNumbers, placedFigures, surveyLayout, type ContentsLabels } from "./survey-layout.ts";

const labels: ContentsLabels = { summary: "S", context: "C", findings: "F", decisions: "D", leading: "L", outcome: "O", reflection: "R" };
const blockKey = (b: Block) => JSON.stringify(b);

describe("survey layout", () => {
  for (const [slug, study] of Object.entries(exampleCaseStudies)) {
    const card = exampleCards.find((c) => c.slug === slug)!;
    const layout = surveyLayout(study, card, labels);

    it(`${slug}: every figure of the stages and the hero placed exactly once`, () => {
      const placed = placedFigures(layout);
      const written = [...study.stages.flatMap((s) => s.blocks.filter((b) => b.kind === "figure").map((b) => (b as { id: string }).id)), ...(study.hero ? [study.hero] : [])];
      assert.equal(new Set(placed).size, placed.length, "no figure twice");
      assert.deepEqual([...placed].sort(), [...new Set(written)].sort());
    });

    it(`${slug}: every other block placed exactly once`, () => {
      const others = (blocks: Block[]) => blocks.filter((b) => b.kind !== "figure" && b.kind !== "decision").map(blockKey);
      const placed = [
        ...others(layout.context.stage.blocks),
        ...others(layout.findings.discovery.blocks),
        ...others(layout.findings.delivery.blocks),
        ...others(layout.decisions.after),
        ...others(layout.leading.stage.blocks),
        ...others(layout.outcome.stage.blocks),
      ];
      const written = study.stages.flatMap((s) => others(s.blocks));
      assert.deepEqual([...placed].sort(), [...written].sort());
    });

    it(`${slug}: the decisions in order, numbered, each with the figure that follows it`, () => {
      const decisions = study.stages.flatMap((s) => s.blocks.filter((b) => b.kind === "decision"));
      assert.deepEqual(layout.decisions.steps.map((s) => s.decision), decisions);
      assert.deepEqual(layout.decisions.steps.map((s) => s.number), decisions.map((_, i) => i + 1));
      const stage = study.stages.find((s) => s.id === "decisions")!;
      for (const step of layout.decisions.steps) {
        const at = stage.blocks.indexOf(step.decision);
        const nextBlock = stage.blocks[at + 1];
        if (step.figure) assert.equal(nextBlock?.kind === "figure" && nextBlock.id, step.figure);
        else assert.notEqual(nextBlock?.kind, "figure");
      }
      assert.deepEqual(layout.options.decisions, decisions);
      assert.equal(layout.options.reversed, study.reversedDecision);
    });

    it(`${slug}: the image pair is two plain images of the findings chapter`, () => {
      assert.ok(layout.findings.pair);
      for (const id of layout.findings.pair!) assert.equal(study.figures?.[id]?.kind, "image");
    });

    it(`${slug}: before/after figures in the outcome band, nowhere else`, () => {
      const compare = Object.entries(study.figures ?? {}).filter(([, f]) => f.kind === "compare").map(([id]) => id);
      assert.deepEqual(layout.outcome.compare, compare.filter((id) => study.stages.some((s) => s.blocks.some((b) => b.kind === "figure" && b.id === id))));
    });

    it(`${slug}: the summary, metric, pull statement and reflection come from the content`, () => {
      assert.equal(layout.summary.problem, study.problem);
      assert.equal(layout.summary.role, study.summary.role);
      assert.equal(layout.summary.keyDecision, study.summary.keyDecision);
      assert.deepEqual(layout.summary.team, [study.facts.team, study.facts.time, card.reach].filter(Boolean));
      assert.deepEqual(layout.metric, card.impact ? { value: card.impact.after, line: study.impactLine } : null);
      assert.equal(layout.leading.pull, study.stages.find((s) => s.id === "leadership")!.finding);
      assert.equal(layout.context.brief, study.summary.brief);
      assert.deepEqual(layout.reflection, { lookingBack: study.lookingBack, didNotDo: study.didNotDo, credits: study.credits });
      assert.equal(layout.map, study.hero ?? null);
    });

    it(`${slug}: each stage's finding is a heading or the pull statement`, () => {
      const used = [layout.context.stage.finding, layout.findings.discovery.finding, layout.findings.delivery.finding, layout.decisions.finding, layout.leading.pull, layout.outcome.stage.finding];
      assert.deepEqual([...used].sort(), study.stages.map((s) => s.finding).sort());
    });
  }

  it("the contents trail lists the parts in page order", () => {
    const [slug, study] = Object.entries(exampleCaseStudies)[0];
    const layout = surveyLayout(study, exampleCards.find((c) => c.slug === slug)!, labels);
    assert.deepEqual(layout.contents.map((c) => c.label), ["S", "C", "F", "D", "L", "O", "R"]);
  });

  it("without a headline number there is no metric band; without two images, no pair", () => {
    const study = structuredClone(Object.values(exampleCaseStudies)[0]) as CaseStudy;
    for (const s of study.stages) if (s.id === "discovery" || s.id === "delivery") s.blocks = s.blocks.filter((b) => b.kind !== "figure");
    const layout = surveyLayout(study, {}, labels);
    assert.equal(layout.metric, null);
    assert.equal(layout.findings.pair, null);
  });
});

describe("page numbers", () => {
  for (const [slug, study] of Object.entries(exampleCaseStudies)) {
    it(`${slug}: figures numbered 1…n in page order, the map's hero not numbered`, () => {
      const layout = surveyLayout(study, exampleCards.find((c) => c.slug === slug)!, labels);
      const { figures } = pageNumbers(layout);
      const order = placedFigures(layout).filter((id) => id !== layout.map);
      assert.deepEqual([...figures.keys()], order);
      assert.deepEqual([...figures.values()], order.map((_, i) => i + 1));
    });
  }
});
