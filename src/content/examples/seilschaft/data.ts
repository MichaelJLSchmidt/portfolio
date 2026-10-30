/**
 * Seilschaft: the single source for every number (fictional). Copy, the Summit card, figure
 * captions, chart artefacts and tables read from here through {{tokens}} (src/lib/fill.ts);
 * npm run check:figures fails when a key figure anywhere differs from this file, when copy or an
 * artefact source writes a digit of its own, or when the committed images are older than it.
 */
import { format } from "@/lib/fill";

export const data = {
  years: { start: 2021, end: 2024, retro: 2022 },
  project: { years: 3 },
  /** The product landscape the team served. */
  org: { productTeams: 14, clusters: 4 },
  /** The practice: two designers at the start, six at the end. */
  team: {
    start: 2,
    end: 6,
    resigned: 1,
    hires: 4,
    /** The UX engineer moved across from a development team; not a hire. */
    internalMoves: 1,
    designers: 4,
    researchers: 1,
    uxEngineers: 1,
    promotions: 2,
  },
  /** The service desk in 2021, from the team's own tickets. */
  desk: {
    lateWeeks: 2,
    /** Requests arriving within lateWeeks of their release (%). */
    latePct: 64,
    visualOnly: { n: 6, of: 10 },
    reworkHours: 420,
    neverMet: 11,
  },
  /** The staged ask to the steering board. */
  ask: { yearOneHires: 2, milestones: 2, reviewMonths: 12, intakeMonths: 6, firstTeams: 4 },
  interviews: {
    productOwners: 14,
    earlier: 11,
    notEarlier: 3,
    internalTools: 2,
    minutes: 45,
    /** What held the willing ones back, one main reason each. */
    reasons: { slot: 5, scope: 3, name: 3 },
  },
  decisions: { count: 3 },
  intake: { tiers: 3, polishDays: 2 },
  rituals: { critMinutes: 45, researchDaysPerMonth: 1, showcasesPerYear: 4, poolCitizens: 140 },
  onboarding: { first: 30, second: 60, third: 90 },
  ladder: { levels: 4 },
  hiring: { seniorWaitMonths: 5, mentorMonth: 4, slowMonths: 6, optionSize: 3, juniors: 2, workSampleHours: 2, panel: 3, criteria: 5 },
  /** Share of requests that reached UX before development started, per quarter (%, measured). */
  requests: {
    before: 18,
    after: 71,
    quarterly: [18, 21, 26, 31, 37, 44, 50, 55, 60, 65, 68, 71],
  },
  /** Product teams with a named designer (of org.productTeams), every half year (measured). */
  named: { before: 3, after: 11, halfYearly: [3, 4, 6, 7, 9, 10, 11] },
  attrition: { before: 1, after: 0 },
  /** Team engagement score, an eNPS-style pulse (−100 to +100, estimated from a small team). */
  engagement: { before: 12, after: 46 },
  reflection: { quarterMonths: 3, rotateAt: 8 },
  card: { cost: 3, costScale: 5 },
  /** People outside the team who worked with it (the team list). */
  partners: { hr: 1, sponsor: 1 },
  /** The career ladder: first a wiki page written by the team alone, then rebuilt with HR. */
  reversal: { wikiPublished: "March 2022", turnedBack: "October 2022", hrPublished: "May 2023", lostMonths: 7, hrMonths: 7 },
  /** After the practice was set up: dated observations (intake log, support desk, research days). */
  log: {
    /** Months after the intake opened until every product team had used it. */
    adoption: { date: "January 2022", months: 6 },
    /** Polish tickets merged in one quarter, and the redesigns they belonged to. */
    split: { date: "June 2022", merged: 9, redesigns: 3 },
    splitFixed: { date: "September 2022", merged: 0 },
    /** Support tickets about failed invoice payments, per month (payments cluster). */
    payments: { date: "June 2023", before: 120, after: 45 },
    /** Citizens from the pool who completed a building-permit application unaided. */
    permitTest: { date: "November 2023", n: 8, before: 3, after: 7 },
    review: { date: "March 2024" },
  },
};

export type SeilschaftData = typeof data;

const as = (value: number, fmt?: string) => format(value, fmt, "keyFigures");

/** Figures that must agree everywhere they appear: copy, card and chart text (check:figures). */
export const keyFigures: { label: string; text: string; in: string[] }[] = [
  { label: "requests before development, before", text: `${data.requests.before}%`, in: ["copy", "card", "sl-requests-chart"] },
  { label: "requests before development, after", text: `${data.requests.after}%`, in: ["copy", "card", "sl-requests-chart"] },
  { label: "teams with a named designer, before", text: `${data.named.before} of ${data.org.productTeams}`, in: ["copy", "sl-designers-chart"] },
  { label: "teams with a named designer, after", text: `${data.named.after} of ${data.org.productTeams}`, in: ["copy", "sl-designers-chart"] },
  { label: "team size", text: `${data.team.start} → ${data.team.end}`, in: ["copy", "card"] },
  { label: "product teams", text: `${data.org.productTeams} product teams`, in: ["copy", "card", "sl-hero"] },
  { label: "hires", text: `${data.team.hires} hires`, in: ["copy", "card"] },
  { label: "promotions", text: `${data.team.promotions} internal promotions`, in: ["card"] },
  { label: "Polish cap", text: `${data.intake.polishDays} days`, in: ["copy", "sl-intake-board"] },
  { label: "participant pool", text: `${data.rituals.poolCitizens} citizens`, in: ["copy", "sl-rituals"] },
  { label: "product owners interviewed", text: `${data.interviews.productOwners} product owners`, in: ["copy", "sl-interviews"] },
  { label: "would involve UX earlier", text: `${data.interviews.earlier}`, in: ["copy", "sl-interviews"] },
  { label: "crit minutes", text: `${data.rituals.critMinutes} minutes`, in: ["copy", "sl-rituals"] },
  { label: "engagement before", text: as(data.engagement.before, "signed"), in: ["copy"] },
  { label: "engagement after", text: as(data.engagement.after, "signed"), in: ["copy"] },
  { label: "project years", text: `${data.project.years} years`, in: ["copy"] },
];

const d = data;
const last = <T,>(a: T[]) => a[a.length - 1];

/** Relations the numbers must keep (npm run check:figures). */
export const consistency: [string, boolean][] = [
  ["start − resigned + hires + internal moves = end", d.team.start - d.team.resigned + d.team.hires + d.team.internalMoves === d.team.end],
  ["designers + researchers + UX engineers = end", d.team.designers + d.team.researchers + d.team.uxEngineers === d.team.end],
  ["teams that never met a designer + teams with a named one = all teams", d.desk.neverMet + d.named.before === d.org.productTeams],
  ["interviews cover every product team", d.interviews.productOwners === d.org.productTeams],
  ["those who would involve UX earlier and those who wouldn't add up to the interviewed", d.interviews.earlier + d.interviews.notEarlier === d.interviews.productOwners],
  ["the internal-tools owners are among those who wouldn't", d.interviews.internalTools <= d.interviews.notEarlier],
  ["one main reason per willing product owner", Object.values(d.interviews.reasons).reduce((a, b) => a + b, 0) === d.interviews.earlier],
  ["late requests are most requests", d.desk.latePct > 50 && d.desk.latePct <= 100],
  ["the first named designers fit the clusters' teams", d.ask.firstTeams <= d.org.productTeams],
  ["the request chart starts and ends at the outcome figures", d.requests.quarterly[0] === d.requests.before && last(d.requests.quarterly) === d.requests.after],
  ["one request figure per quarter of the project", d.requests.quarterly.length === d.project.years * 4],
  ["the named-designer chart starts and ends at the outcome figures", d.named.halfYearly[0] === d.named.before && last(d.named.halfYearly) === d.named.after],
  ["one named-designer figure per half year, both ends included", d.named.halfYearly.length === d.project.years * 2 + 1],
  ["named designers never exceed the teams", d.named.halfYearly.every((n) => n <= d.org.productTeams)],
  ["the project spans its years", d.years.end - d.years.start === d.project.years],
  ["the year-one hires are part of all hires", d.ask.yearOneHires <= d.team.hires],
  ["onboarding steps are thirty days apart", d.onboarding.second - d.onboarding.first === 30 && d.onboarding.third - d.onboarding.second === 30],
  ["the senior co-mentors before the first year is out", d.hiring.mentorMonth < 12],
  ["designer hires (a senior, then juniors) plus the researcher are all hires", 1 + d.hiring.juniors + d.team.researchers === d.team.hires],
  ["the split Polish tickets belong to fewer redesigns, and the fix stopped the merging", d.log.split.redesigns < d.log.split.merged && d.log.splitFixed.merged < d.log.split.merged],
  ["the permit test improved and fits its participants", d.log.permitTest.before < d.log.permitTest.after && d.log.permitTest.after <= d.log.permitTest.n],
  ["payment support tickets fell", d.log.payments.after < d.log.payments.before],
];
