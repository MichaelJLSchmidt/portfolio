/**
 * Test Project: the single source for every number (fictional). Copy, the Summit card, figure
 * captions, chart artefacts and tables read from here through {{tokens}} (src/lib/fill.ts);
 * npm run check:figures fails when a key figure anywhere differs from this file, when copy or an
 * artefact source writes a digit of its own, or when the committed images are older than it.
 */
import { format } from "@/lib/fill";

export const data = {
  years: { start: 2025, end: 2026, caseSystem: 2011, demandRise: 2023, returnsSample: 2024 },
  subsidy: { maxChf: 10000 },
  pdf: { pages: 9, comparedPage: 3, comparedFields: 14 },
  product: { steps: 5, firstStep: 1, uploadNotes: 5 },
  problem: { incompletePct: 62, medianDays: 41, caseworkers: 9 },
  landscape: { constraints: 6, actors: 7, channels: 4, systems: 2 },
  api: { monthsAway: 18 },
  team: { ux: 4, uxFte: 3.2, productDev: 7, designersLed: 3, developers: 5, architects: 1 },
  workshops: { count: 5, participants: 31, units: 4, legalApproved: 3, options: 3, votes: { a: 3, b: 6, c: 22 } },
  /** Decision matrix ratings (filled dots out of `scale`; for effort, more dots = less effort). */
  matrix: {
    scale: 3,
    a: { legal: 3, data: 1, owner: 1, build: 3 },
    b: { legal: 0, data: 3, owner: 3, build: 3 },
    c: { legal: 3, data: 3, owner: 2, build: 1 },
  },
  project: { months: 11, coachingMonth: 6 },
  reach: { perYear: 2800 },
  discovery: {
    interviews: 14,
    homeowners: 6,
    installers: 5,
    caseworkers: 3,
    inFrench: 4,
    shadowDays: 2,
    callsLogged: 41,
    filesAnalysed: 200,
    surveyN: 312,
    surveyResponsePct: 18,
    installerFilledPct: 71,
    threeDocumentsPct: 80,
    documents: 3,
    observations: 60,
    themes: 6,
    insights: 3,
    handoffs: 7,
    gaps: 4,
    archetypes: 3,
    fieldNoteWeek: 4,
    /** Notes per theme on the affinity map; they add up to `observations`. */
    themeNotes: { installer: 12, documents: 16, rekeying: 10, status: 9, language: 7, login: 6 },
  },
  decisions: {
    stalledPct: 11,
    reminders: 2,
    precheckQuestions: 5,
    notEligible: { one: 1, in: 5 },
    vendorDemoWeeks: 2,
    vendorIssues: 38,
    firstDemoWeeks: 6,
    components: 23,
    reuseServices: 3,
    statusWorkingDays: 2,
  },
  delivery: {
    sketchWeek: 1,
    midFidelityWeek: 3,
    prototypeWeek: 6,
    rounds: 3,
    perRound: 8,
    participants: 24,
    inFrench: 9,
    assistiveTech: 4,
    success: { r1: 5, r2: 7, r3: 8 },
    auditIssues: 6,
    betaWeeks: 8,
    betaFirms: 3,
  },
  outcomes: {
    applications: 640,
    months: 3,
    complete: { before: 38, after: 82 },
    incomplete: { before: 62, after: 18 },
    medianDays: { before: 41, after: 19 },
    sus: { before: 58, after: 81 },
    callsPct: -35,
    callLogWeeks: 2,
    reuse: { before: 0, after: 3 },
    baselineFiles: 200,
  },
  reflection: { legalMinutes: 30 },
  card: { cost: 4, costScale: 5 },
  /** Sample values shown in the fictional product UI (artefacts only). */
  ui: {
    floorAreaM2: 145,
    buildYear: 1978,
    quoteChf: 38400,
    expectedChf: 10000,
    sampleDate: "14.03.2026",
    maxUploadMb: 10,
    stepUpload: 4,
    precheckMinutes: 2,
  },
};

export type TestProjectData = typeof data;

const as = (value: number, fmt?: string) => format(value, fmt, "keyFigures");

/** Figures that must agree everywhere they appear: copy, card and chart text (check:figures). */
export const keyFigures: { label: string; text: string; in: string[] }[] = [
  { label: "complete on first submission, before", text: `${data.outcomes.complete.before}%`, in: ["copy", "tp-outcomes"] },
  { label: "complete on first submission, after", text: `${data.outcomes.complete.after}%`, in: ["copy", "tp-outcomes"] },
  { label: "incomplete submissions, before", text: `${data.outcomes.incomplete.before}%`, in: ["copy"] },
  { label: "incomplete submissions, after", text: `${data.outcomes.incomplete.after}%`, in: ["copy"] },
  { label: "median days to decision, before", text: `${data.outcomes.medianDays.before}`, in: ["copy", "tp-outcomes"] },
  { label: "median days to decision, after", text: `${data.outcomes.medianDays.after}`, in: ["copy", "tp-outcomes"] },
  { label: "caseworker calls", text: `${as(data.outcomes.callsPct)}%`, in: ["copy", "tp-outcomes"] },
  { label: "SUS before", text: `${data.outcomes.sus.before}`, in: ["copy"] },
  { label: "SUS after", text: `${data.outcomes.sus.after}`, in: ["copy"] },
  { label: "task success, round 1", text: `${data.delivery.success.r1}/${data.delivery.perRound}`, in: ["copy", "tp-test-rounds"] },
  { label: "task success, round 2", text: `${data.delivery.success.r2}/${data.delivery.perRound}`, in: ["copy", "tp-test-rounds"] },
  { label: "task success, round 3", text: `${data.delivery.success.r3}/${data.delivery.perRound}`, in: ["copy", "tp-test-rounds"] },
  { label: "workshops (summary)", text: `${data.workshops.count} cross-unit workshops`, in: ["copy"] },
  { label: "workshops (card)", text: `${data.workshops.count} workshops`, in: ["card"] },
  { label: "workshop participants", text: `${data.workshops.participants}`, in: ["copy", "card", "tp-workshop-board", "tp-decision-matrix"] },
  { label: "components", text: `${data.decisions.components}`, in: ["copy", "card", "tp-design-system"] },
  { label: "reuse by services", text: `${data.decisions.reuseServices} services`, in: ["copy", "card"] },
  { label: "project months", text: `${data.project.months} months`, in: ["copy", "card"] },
  { label: "team", text: `${data.team.ux} + ${data.team.productDev}`, in: ["card"] },
  { label: "reach a year", text: as(data.reach.perYear, "en"), in: ["card"] },
  { label: "interviews", text: `${data.discovery.interviews} interviews`, in: ["copy", "tp-affinity"] },
  { label: "hand-offs", text: `${data.discovery.handoffs} hand-offs`, in: ["copy", "tp-blueprint-current"] },
  { label: "no-feedback gaps", text: `${data.discovery.gaps} moments`, in: ["copy", "tp-blueprint-current"] },
  { label: "pre-check questions", text: `${data.decisions.precheckQuestions} questions`, in: ["tp-flow"] },
  { label: "stalled drafts", text: `${data.decisions.stalledPct}%`, in: ["copy"] },
  { label: "maximum subsidy (English copy)", text: `CHF ${as(data.subsidy.maxChf, "en")}`, in: ["copy"] },
  { label: "maximum subsidy (product UI)", text: `CHF ${as(data.subsidy.maxChf, "ch")}`, in: ["tp-hero"] },
  { label: "steps", text: `${data.product.firstStep} von ${data.product.steps}`, in: ["tp-hero"] },
];

const d = data;
const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

/** Relations the numbers must keep (npm run check:figures). */
export const consistency: [string, boolean][] = [
  ["complete + incomplete = 100% before", d.outcomes.complete.before + d.outcomes.incomplete.before === 100],
  ["complete + incomplete = 100% after", d.outcomes.complete.after + d.outcomes.incomplete.after === 100],
  ["the problem's incomplete share is the outcome baseline", d.problem.incompletePct === d.outcomes.incomplete.before],
  ["the problem's median days are the outcome baseline", d.problem.medianDays === d.outcomes.medianDays.before],
  ["interviews = homeowners + installers + caseworkers", d.discovery.interviews === d.discovery.homeowners + d.discovery.installers + d.discovery.caseworkers],
  ["notes per theme add up to the observations", sum(d.discovery.themeNotes) === d.discovery.observations],
  ["one theme per note cluster", Object.keys(d.discovery.themeNotes).length === d.discovery.themes],
  ["dot votes add up to the participants", sum(d.workshops.votes) === d.workshops.participants],
  ["test participants = rounds × per round", d.delivery.participants === d.delivery.rounds * d.delivery.perRound],
  ["one success figure per round", Object.keys(d.delivery.success).length === d.delivery.rounds],
  ["no round has more successes than participants", Object.values(d.delivery.success).every((n) => n <= d.delivery.perRound)],
  ["the outcome baseline sample is the analysed files", d.outcomes.baselineFiles === d.discovery.filesAnalysed],
  ["design-system reuse after = services reusing the components", d.outcomes.reuse.after === d.decisions.reuseServices],
  ["the stepper's upload step is within the steps", d.ui.stepUpload <= d.product.steps],
  ["matrix ratings stay within the scale", ["a", "b", "c"].every((k) => Object.values(d.matrix[k as "a"]).every((n) => n >= 0 && n <= d.matrix.scale))],
];
