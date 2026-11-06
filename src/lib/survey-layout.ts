/**
 * The Calm Survey template: how a case study's content (src/lib/case-study.ts) is laid out on the
 * page, as a pure function so the mapping is tested and the page only renders. Nothing is
 * invented: every slot takes existing content, and every part of a case study lands in exactly one
 * slot. In page order:
 *
 *  1. header plate: the card's level plate, the meta line, the H1, summit · altitude · coordinates
 *  2. summary band (sheet): problem; my role; team · duration · reach; key decision; outcome
 *  3. chapter 01, context: the context stage and the brief, beside the contents trail
 *  4. metric band: the card's headline number and the impact line
 *  5. chapter 02, findings: the discovery stage, an offset image pair (the chapter's first two
 *     plain images), then the delivery stage
 *  6. pinned decision: the decisions stage; each decision is a step, its figure the one that
 *     follows it in the stage (or, without one, its options set as type)
 *  7. options band (sheet): every decision's options, then the decision we reversed
 *  8. map frame: the product hero, full bleed in a map-sheet frame
 *  9. chapter 03, leading the team: the leadership stage's finding as the one pull statement, its
 *     blocks, the team I led, what I put in place and the team by role
 * 10. outcome band (sheet): the results as metric tiles, the outcome stage, any before/after
 *     figure, the after-launch log
 * 11. reflection: looking back, what I did not do, the credits
 * 12. next case study (rendered by the page from the card order)
 */
import { STAGE_IDS, type Block, type CaseStudy, type Decision, type FigureSpec, type OutcomeItem, type ResultRow, type Stage, type StageId } from "./case-study";

/** What the layout needs from the card. */
export type LayoutCard = { reach?: string; impact?: { before: string; after: string } };

export type DecisionStep = {
  decision: Decision;
  /** "Decision n" across the page. */
  number: number;
  /** The figure that follows the decision in its stage; null: its options are set as type. */
  figure: string | null;
};

export type ContentsEntry = { id: string; label: string };

export type SurveyLayout = {
  summary: {
    problem: string;
    role: string;
    /** Team · Duration · Reach, each when present. */
    team: string[];
    keyDecision: string;
    outcome: OutcomeItem[];
    note?: string;
  };
  context: { stage: Stage; brief: string };
  metric: { value: string; line: string } | null;
  findings: { discovery: Stage; pair: [string, string] | null; delivery: Stage };
  /** The decisions stage: its finding heads the pinned decision; `after` holds its other blocks. */
  decisions: { id: string; finding: string; steps: DecisionStep[]; after: Block[] };
  options: { decisions: Decision[]; reversed: Decision };
  map: string | null;
  leading: {
    /** The leadership stage's finding, set as the page's one pull statement. */
    pull: string;
    stage: Stage;
    teamLed: string;
    putInPlace: string[];
    team: CaseStudy["team"];
  };
  outcome: {
    stage: Stage;
    results: { caption: string; rows: ResultRow[]; legend?: CaseStudy["results"]["legend"] };
    /** Before/after figures, wherever the stages placed them. */
    compare: string[];
    afterLaunch: CaseStudy["afterLaunch"];
  };
  reflection: { lookingBack: CaseStudy["lookingBack"]; didNotDo: string; credits: string };
  /** The contents trail: the page's parts, in order, with their anchors. */
  contents: ContentsEntry[];
};

/** The contents trail's labels and the anchors they lead to. */
export const SECTION_IDS = {
  summary: "summary",
  context: "context",
  findings: "findings",
  decisions: "decisions",
  leading: "leading",
  outcome: "outcome",
  reflection: "reflection",
} as const;

export type ContentsLabels = Record<keyof typeof SECTION_IDS, string>;

const isFigure = (b: Block): b is Extract<Block, { kind: "figure" }> => b.kind === "figure";

/** A stage by its id (validateCaseStudy holds every case study to the six ids, in order). */
function stageOf(study: CaseStudy, id: StageId): Stage {
  const found = study.stages.find((s) => s.id === id) ?? study.stages[STAGE_IDS.indexOf(id)];
  if (!found) throw new Error(`surveyLayout: no "${id}" stage`);
  return found;
}

const without = (stage: Stage, ids: ReadonlySet<string>): Stage => ({ ...stage, blocks: stage.blocks.filter((b) => !(isFigure(b) && ids.has(b.id))) });

/**
 * Lays a case study out on the Calm Survey template. `card` brings the reach and the headline
 * number; `labels` names the contents trail's entries.
 */
export function surveyLayout(study: CaseStudy, card: LayoutCard, labels: ContentsLabels): SurveyLayout {
  const figures: Record<string, FigureSpec> = study.figures ?? {};
  const kind = (id: string) => figures[id]?.kind;

  const context = stageOf(study, "context");
  const leadership = stageOf(study, "leadership");
  const discovery = stageOf(study, "discovery");
  const decisionsStage = stageOf(study, "decisions");
  const delivery = stageOf(study, "delivery");
  const outcome = stageOf(study, "outcome");

  // Before/after figures go to the outcome band, wherever they were written.
  const compare = study.stages.flatMap((s) => s.blocks.filter(isFigure).map((b) => b.id)).filter((id) => kind(id) === "compare");
  const compareSet = new Set(compare);

  // The image pair: the findings chapter's first two plain images.
  const plain = [...discovery.blocks, ...delivery.blocks].filter(isFigure).map((b) => b.id).filter((id) => kind(id) === "image" && id !== study.hero);
  const pair: [string, string] | null = plain.length >= 2 ? [plain[0], plain[1]] : null;
  const moved = new Set([...compareSet, ...(pair ?? [])]);

  // Decisions: each with the figure that follows it, before the next decision.
  let n = 0;
  const steps: DecisionStep[] = [];
  const after: Block[] = [];
  decisionsStage.blocks.forEach((b) => {
    if (b.kind === "decision") steps.push({ decision: b, number: ++n, figure: null });
    else if (isFigure(b) && !compareSet.has(b.id)) {
      const last = steps[steps.length - 1];
      if (last && !last.figure) last.figure = b.id;
      else after.push(b);
    } else if (!isFigure(b)) after.push(b);
  });

  const impact = card.impact?.after?.trim();
  const team = [study.facts.team, study.facts.time, card.reach].filter((t): t is string => Boolean(t?.trim()));

  return {
    summary: {
      problem: study.problem,
      role: study.summary.role,
      team,
      keyDecision: study.summary.keyDecision,
      outcome: study.summary.outcome,
      note: study.summary.note,
    },
    context: { stage: without(context, moved), brief: study.summary.brief },
    metric: impact ? { value: impact, line: study.impactLine } : null,
    findings: { discovery: without(discovery, moved), pair, delivery: without(delivery, moved) },
    decisions: { id: decisionsStage.id, finding: decisionsStage.finding, steps, after },
    options: { decisions: steps.map((s) => s.decision), reversed: study.reversedDecision },
    map: study.hero && figures[study.hero] ? study.hero : null,
    leading: {
      pull: leadership.finding,
      stage: without(leadership, moved),
      teamLed: study.summary.teamLed,
      putInPlace: study.summary.putInPlace,
      team: study.team,
    },
    outcome: {
      stage: without(outcome, moved),
      results: { caption: study.results.caption, rows: study.results.rows, legend: study.results.legend },
      compare,
      afterLaunch: study.afterLaunch,
    },
    reflection: { lookingBack: study.lookingBack, didNotDo: study.didNotDo, credits: study.credits },
    contents: (Object.keys(SECTION_IDS) as (keyof typeof SECTION_IDS)[]).map((k) => ({ id: SECTION_IDS[k], label: labels[k] })),
  };
}

/** Every figure id the layout places, in page order (each exactly once); numbered on the page, the map's hero aside. */
export function placedFigures(layout: SurveyLayout): string[] {
  const inBlocks = (s: Stage | Block[]) => (Array.isArray(s) ? s : s.blocks).filter(isFigure).map((b) => b.id);
  return [
    ...inBlocks(layout.context.stage),
    ...inBlocks(layout.findings.discovery),
    ...(layout.findings.pair ?? []),
    ...inBlocks(layout.findings.delivery),
    ...layout.decisions.steps.flatMap((s) => (s.figure ? [s.figure] : [])),
    ...inBlocks(layout.decisions.after),
    ...(layout.map ? [layout.map] : []),
    ...inBlocks(layout.leading.stage),
    ...layout.outcome.compare,
    ...inBlocks(layout.outcome.stage),
  ];
}

/** The page's figure numbers (the map's hero is not numbered) and side-note numbers, in page order. */
export function pageNumbers(layout: SurveyLayout): { figures: Map<string, number>; notes: Map<Block, number> } {
  const figures = new Map<string, number>();
  for (const id of placedFigures(layout)) if (id !== layout.map && !figures.has(id)) figures.set(id, figures.size + 1);
  const notes = new Map<Block, number>();
  const stages = [layout.context.stage, layout.findings.discovery, layout.findings.delivery, { blocks: layout.decisions.after }, layout.leading.stage, layout.outcome.stage];
  for (const s of stages) for (const b of s.blocks) if (b.kind === "p" && b.note) notes.set(b, notes.size + 1);
  return { figures, notes };
}
