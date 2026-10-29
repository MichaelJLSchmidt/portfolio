/**
 * Gratweg: the single source for every number (fictional). Copy, the Summit card, figure
 * captions, chart artefacts and tables read from here through {{tokens}} (src/lib/fill.ts);
 * npm run check:figures fails when a key figure anywhere differs from this file, when copy or an
 * artefact source writes a digit of its own, or when the committed images are older than it.
 */
import { format } from "@/lib/fill";

/** Accessibility issues per product in the external audit, before and after adoption. */
const auditBefore = [42, 35, 51, 28, 39, 47, 33, 30, 45];
const auditAfter = [15, 13, 18, 10, 14, 17, 12, 11, 16];
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

export const data = {
  years: { start: 2023, end: 2025, testNote: 2023 },
  project: { years: 2, months: 24 },
  /** The landscape before the system. */
  landscape: { products: 9, libraries: 4, blues: 11, datePickers: 6, auditFailed: 7, onMaterial: 6 },
  /** The coalition that co-signed the proposal. */
  coalition: { leadDevelopers: 3, signatories: 5 },
  /** The business case: the teams' own rebuild hours for the date picker alone. */
  businessCase: { datePickerHours: 480, teams: 9 },
  pilot: { months: 6, products: 2, metrics: 1 },
  inventory: { instances: 1240, patterns: 61, core: 23, coverPct: 80 },
  v1: { components: 23 },
  team: { core: 3, designers: 1, developers: 2, contributors: 12 },
  governance: { rfcDays: 10, officeHoursPerWeek: 2, officeHours: "twice a week", fastLaneDays: 2, deprecationMonths: 6 },
  decisions: { count: 3, customYears: 2 },
  reflection: { tokenRounds: 2 },
  audit: {
    before: auditBefore,
    after: auditAfter,
    totalBefore: sum(auditBefore),
    totalAfter: sum(auditAfter),
    changePct: -64,
  },
  outcomes: {
    products: { before: 0, after: 9 },
    firstScreen: { beforeWeeks: 3, afterDays: 4 },
    hoursSaved: 1900,
    countedByHandMonths: 6,
  },
  /** Products on the system, every quarter from the start (measured from package downloads). */
  adoption: { quarterly: [0, 0, 2, 2, 4, 5, 7, 8, 9] },
  /** Foundation options rated in filled dots out of `scale` (more is better; for cost: cheaper). */
  options: {
    scale: 3,
    custom: { time: 0, a11y: 1, cost: 0, brand: 3 },
    kit: { time: 3, a11y: 2, cost: 1, brand: 1 },
    material: { time: 3, a11y: 3, cost: 3, brand: 2 },
  },
  card: { cost: 5, costScale: 5 },
};

export type GratwegData = typeof data;

const as = (value: number, fmt?: string) => format(value, fmt, "keyFigures");

/** Figures that must agree everywhere they appear: copy, card and chart text (check:figures). */
export const keyFigures: { label: string; text: string; in: string[] }[] = [
  { label: "products", text: `${data.landscape.products} products`, in: ["copy", "card", "gw-hero"] },
  { label: "shades of blue", text: `${as(data.landscape.blues, "word")} shades`, in: ["copy"] },
  { label: "blues in the audit", text: `${data.landscape.blues} blues`, in: ["gw-hero"] },
  { label: "UI instances", text: as(data.inventory.instances, "en"), in: ["copy", "gw-pareto"] },
  { label: "patterns", text: `${data.inventory.patterns} distinct patterns`, in: ["copy"] },
  { label: "core patterns", text: `${data.inventory.core} of them`, in: ["copy"] },
  { label: "coverage", text: `${data.inventory.coverPct}%`, in: ["copy", "gw-pareto"] },
  { label: "date picker hours", text: `${data.businessCase.datePickerHours} hours`, in: ["copy", "gw-coalition"] },
  { label: "contributors", text: `${data.team.contributors} contributors`, in: ["copy", "card", "gw-governance"] },
  { label: "RFC window", text: `${data.governance.rfcDays}-day`, in: ["copy", "gw-governance"] },
  { label: "products on the system, after", text: `${data.outcomes.products.after} of ${data.landscape.products}`, in: ["copy", "gw-adoption"] },
  { label: "accessibility change", text: `${as(data.audit.changePct)}%`, in: ["copy", "gw-a11y-chart"] },
  { label: "hours saved", text: as(data.outcomes.hoursSaved, "en"), in: ["copy"] },
  { label: "first usable screen, after", text: `${data.outcomes.firstScreen.afterDays} days`, in: ["copy"] },
  { label: "team led (card)", text: `${data.team.core} + ${data.team.contributors}`, in: ["card"] },
  { label: "project years", text: `${data.project.years} years`, in: ["copy"] },
];

const d = data;
const last = <T,>(a: T[]) => a[a.length - 1];
const change = Math.round((d.audit.totalAfter / d.audit.totalBefore - 1) * 100);

/** Relations the numbers must keep (npm run check:figures). */
export const consistency: [string, boolean][] = [
  ["core team = designers + component developers", d.team.designers + d.team.developers === d.team.core],
  ["signatories = lead developers + accessibility officer + head of digital services", d.coalition.leadDevelopers + 2 === d.coalition.signatories],
  ["failed audits are among the products", d.landscape.auditFailed <= d.landscape.products],
  ["one audit figure per product, before and after", d.audit.before.length === d.landscape.products && d.audit.after.length === d.landscape.products],
  ["every product has fewer issues after", d.audit.before.every((b, i) => d.audit.after[i] < b)],
  ["the audit change is the totals' change", change === d.audit.changePct],
  ["the core patterns are among all patterns", d.inventory.core < d.inventory.patterns],
  ["version one ships the core patterns", d.v1.components === d.inventory.core],
  ["the pilot's products are among all products", d.pilot.products <= d.landscape.products],
  ["adoption runs from zero to every product", d.adoption.quarterly[0] === d.outcomes.products.before && last(d.adoption.quarterly) === d.outcomes.products.after],
  ["adoption never falls", d.adoption.quarterly.every((n, i, a) => i === 0 || n >= a[i - 1])],
  ["one adoption figure per quarter, both ends included", d.adoption.quarterly.length === d.project.months / 3 + 1],
  ["every product is on the system at the end", d.outcomes.products.after === d.landscape.products],
  ["the project spans its years", d.years.end - d.years.start === d.project.years && d.project.months === d.project.years * 12],
  ["the business case covers every team", d.businessCase.teams === d.landscape.products],
  ["the fast lane is faster than the RFC window", d.governance.fastLaneDays < d.governance.rfcDays],
  ["office hours: twice a week", d.governance.officeHoursPerWeek === 2 && d.governance.officeHours === "twice a week"],
  ["the products already on Angular Material are among all products", d.landscape.onMaterial <= d.landscape.products],
  ["option ratings stay within the scale", (["custom", "kit", "material"] as const).every((k) => Object.values(d.options[k]).every((n) => n >= 0 && n <= d.options.scale))],
];
