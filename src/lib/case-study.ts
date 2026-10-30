/**
 * The case-study content model: what a page under /work/<slug>/ is built from. Copy lives in
 * src/content (case-studies.ts and src/content/examples); components in
 * src/components/case-study render it. Every case study has the same parts, in this order:
 *
 * - the trailhead spread: the problem in two or three sentences, the result in one line (the
 *   impact line) and role · team · time;
 * - the summary as a map legend: the brief, the outcome, my role, the team I led, what I put in
 *   place, the key decision;
 * - six stages, one per stage of the ascent (src/content/geo.ts), each headed by its finding;
 *   blocks inside: paragraphs (with optional side notes), lists, figures, decisions (a fork of
 *   options with what spoke for and against each and its cost), at most one key insight;
 * - a decision we reversed, dated; what happened after launch, a dated log; the results at the
 *   summit, before and after with the stage each was won at;
 * - looking back (each lesson with what I would do next time) and the team, roped together.
 *
 * No quotes or testimonials. `validateCaseStudy` rejects a case study with a part missing.
 */

/** How a number was obtained. Shown as shape plus text, never colour alone. */
export type Evidence = "measured" | "estimated" | "qualitative";

/** A list item: plain text, or a bold lead-in followed by text. */
export type ListItem = string | { lead: string; text: string };

/** Long description of a complex diagram, as a nested list. */
export type LongDescription = (string | { text: string; items: LongDescription })[];

/** One way a decision could have gone. */
export type DecisionOption = {
  label: string;
  pros: string[];
  cons: string[];
  /** What taking it costs (or would have cost). */
  cost: string;
  /** "chosen": the way taken; "rejected": not taken; "reversed": taken, then turned back from. */
  status: "chosen" | "rejected" | "reversed";
  /** A reversed option: when we turned back, and why. */
  turnedBack?: { date: string; text: string };
};

export type Decision = {
  kind: "decision";
  id: string;
  /** The question, e.g. "Who applies?"; the heading reads "Decision 1 — Who applies?". */
  title: string;
  text?: string[];
  /** Two or more options, exactly one chosen. */
  options: DecisionOption[];
  /** A closing sentence after the options (how the cost was carried). */
  after?: string;
};

export type Block =
  /** A paragraph; `note` is a short side note beside it (in the margin, inline on phones). */
  | { kind: "p"; text: string; lead?: string; note?: string }
  | { kind: "list"; intro?: string; items: ListItem[]; ordered?: boolean }
  /** A figure from the case study's `figures`, numbered in order of appearance. */
  | { kind: "figure"; id: string }
  /** The one key insight of the page (an aside with a visible label). */
  | { kind: "insight"; text: string }
  | Decision;

/** A stage of the ascent: its place and altitude come from the card's ascent (geo.ts). */
export type Stage = {
  id: string;
  /** Short name for the timeline and the jump sheet, e.g. "Discovery". */
  nav: string;
  /** What this stage found: the heading, a sentence. */
  finding: string;
  blocks: Block[];
};

export type OutcomeItem = { text: string; evidence: Evidence };

export type FigureSurface = "sheet" | "night";

type FigureBase = {
  /** "What it shows. Why it matters." Set in mono as "FIG. n · caption · source". */
  caption?: string;
  /** Where its data or material comes from, e.g. "Intake log, 2023". */
  source?: string;
  /** Long description behind "Describe this diagram". */
  long?: LongDescription;
  /** "sheet" (map sheet: light UI and diagrams) or "night" (ground-raised: charts, hero). */
  surface: FigureSurface;
  /** Column (~720 px) or wide (~1120 px); full width on phones. */
  size: "column" | "wide";
  /** Adds the "Enlarge" button and the lightbox. */
  zoom?: boolean;
  /** Only for an image in the first viewport: eager, fetchpriority="high". */
  priority?: boolean;
};

/** An image rendered by the artefact pipeline (npm run images). */
export type ImageSpec = {
  alt: string;
  /** Master size in pixels (rendered at 2x). */
  width: number;
  height: number;
};

export type FigureSpec =
  | (FigureBase & { kind: "image"; image: string })
  | (FigureBase & { kind: "compare"; before: string; after: string })
  /** Numbered markers over the image; positions come from the image manifest. */
  | (FigureBase & {
      kind: "hotspots";
      image: string;
      notes: { title: string; text: string }[];
    });

/** One encoded image, from the manifest the pipeline writes. */
export type ImageAsset = {
  width: number;
  height: number;
  /** Tiny blurred WebP as a data URI, shown until the image has loaded. */
  placeholder: string;
  sources: {
    format: "avif" | "webp";
    width: number;
    src: string;
    bytes: number;
  }[];
  /** Marker positions as fractions of the image box (hotspot figures). */
  hotspots?: { n: number; x: number; y: number }[];
};

export type ResultRow = {
  metric: string;
  before: string;
  after: string;
  evidence: Evidence;
  /** The stage (1–6) where it was won. */ stage: number;
};

export type CaseStudy = {
  /** Fictional example: labelled, noindex, never in a live build (src/content/examples). */
  example?: true;
  /** The meta description when there is no `metaDescription`. */
  lede: string;
  /** "Service design · Public sector · …"; the card's type line when absent. */
  typeLine?: string;
  metaDescription?: string;
  /** The problem, in two or three sentences. */
  problem: string;
  /** The result in one line: the trailhead spread and the deck caption. */
  impactLine: string;
  /** Beside the result, in mono: my role, the team, the time it took. */
  facts: { role: string; team: string; time: string };
  /** The summary, as a map legend, in this order. */
  summary: {
    /** What was asked for, and how I reframed it. */
    brief: string;
    outcome: OutcomeItem[];
    role: string;
    /** Whom I led: direct reports, the wider team, people I led without authority. */
    teamLed: string;
    /** The structures I left behind (rituals, processes, systems), one item each. */
    putInPlace: string[];
    keyDecision: string;
    /** A closing line, e.g. "Fictional example data." */
    note?: string;
  };
  /** Figure id of the product hero, shown after the summary. */
  hero?: string;
  /** Exactly six, one per stage of the ascent. */
  stages: Stage[];
  /** A decision we reversed: one option reversed (dated), the one we took instead chosen. */
  reversedDecision: Decision;
  /** What happened after launch: a dated log, newest first. */
  afterLaunch: { caption: string; entries: { date: string; text: string }[] };
  /** The results at the summit: each before and after, with the stage it was won at. */
  results: {
    caption: string;
    legend?: Partial<Record<Evidence, string>>;
    rows: ResultRow[];
  };
  /** Each lesson with what I would do next time ("Next time I would …"). */
  lookingBack: { lesson: string; nextTime: string }[];
  /** The team by role, with how many and what they did. No names. */
  team: { role: string; count: string; line: string }[];
  /** One honest line on the scope I did not own. */
  didNotDo: string;
  credits: string;
  figures?: Record<string, FigureSpec>;
  images?: Record<string, ImageSpec>;
  /** Encoded images by id (generated manifest). */
  assets?: Record<string, ImageAsset>;
};

/** Figure numbers in order of appearance; the hero is not numbered. */
export function figureNumbers(study: Pick<CaseStudy, "stages">): Map<string, number> {
  const numbers = new Map<string, number>();
  for (const w of study.stages) for (const b of w.blocks) if (b.kind === "figure" && !numbers.has(b.id)) numbers.set(b.id, numbers.size + 1);
  return numbers;
}

/** Decision numbers in order of appearance (the reversed decision is not numbered). */
export function decisionNumbers(study: Pick<CaseStudy, "stages">): Map<string, number> {
  const numbers = new Map<string, number>();
  for (const w of study.stages) for (const b of w.blocks) if (b.kind === "decision") numbers.set(b.id, numbers.size + 1);
  return numbers;
}

/** Side-note numbers in order of appearance, keyed by "stage-id:block-index". */
export function noteNumbers(study: Pick<CaseStudy, "stages">): Map<string, number> {
  const numbers = new Map<string, number>();
  for (const w of study.stages) w.blocks.forEach((b, i) => b.kind === "p" && b.note && numbers.set(`${w.id}:${i}`, numbers.size + 1));
  return numbers;
}

/** The figure an image belongs to. */
export function figureOfImage(figures: Record<string, FigureSpec>, image: string): string | undefined {
  return Object.keys(figures).find((id) => {
    const f = figures[id];
    return f.kind === "compare" ? f.before === image || f.after === image : f.image === image;
  });
}

const itemText = (i: ListItem) => (typeof i === "string" ? i : `${i.lead} ${i.text}`);

const decisionText = (d: Decision) => [
  d.title,
  ...(d.text ?? []),
  ...d.options.flatMap((o) => [o.label, ...o.pros, ...o.cons, o.cost, o.turnedBack?.text ?? ""]),
  d.after ?? "",
];

/** The page's running text, in reading order (stages, decisions, captions, results, lessons). */
export function bodyText(study: CaseStudy): string[] {
  const parts: string[] = [study.problem, study.impactLine];
  for (const w of study.stages) {
    parts.push(w.finding);
    for (const b of w.blocks) {
      switch (b.kind) {
        case "p":
          parts.push(b.lead ?? "", b.text, b.note ?? "");
          break;
        case "list":
          parts.push(b.intro ?? "", ...b.items.map(itemText));
          break;
        case "figure":
          parts.push(study.figures?.[b.id]?.caption ?? "");
          if (study.figures?.[b.id]?.kind === "hotspots") {
            const f = study.figures[b.id] as Extract<FigureSpec, { kind: "hotspots" }>;
            parts.push(...f.notes.map((n) => `${n.title} ${n.text}`));
          }
          break;
        case "insight":
          parts.push(b.text);
          break;
        case "decision":
          parts.push(...decisionText(b));
          break;
      }
    }
  }
  parts.push(...decisionText(study.reversedDecision));
  parts.push(...study.afterLaunch.entries.flatMap((e) => [e.date, e.text]));
  parts.push(...study.results.rows.flatMap((r) => [r.metric, r.before, r.after]));
  parts.push(...study.lookingBack.flatMap((l) => [l.lesson, l.nextTime]));
  parts.push(...study.team.flatMap((t) => [t.count, t.role, t.line]));
  parts.push(study.didNotDo, study.credits);
  return parts.filter(Boolean);
}

/**
 * Reading time in whole minutes, the way Medium counts it: the body's words at 265 words a minute,
 * plus 12 s for the first figure and a second less for each one after, down to 3 s.
 */
export function readingMinutes(study: CaseStudy): number {
  const words = bodyText(study)
    .join(" ")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const figures = figureNumbers(study).size;
  const looking = Array.from({ length: figures }, (_, i) => Math.max(3, 12 - i)).reduce((a, b) => a + b, 0);
  return Math.max(1, Math.round(words / 265 + looking / 60));
}

const sentences = (t: string) => t.split(/(?<=[.!?])\s+(?=\S)/).filter((x) => x.trim()).length;
const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;

/**
 * Checks a case study against the template: every part the page needs is there and complete.
 * Returns the problems (none when it is complete). The unit tests and `npm run build` (through
 * check:content) stop on any, so an incomplete case study never reaches a page.
 */
export function validateCaseStudy(slug: string, s: CaseStudy): string[] {
  const out: string[] = [];
  const need = (ok: unknown, what: string) => {
    if (!ok) out.push(`${slug}: ${what}`);
  };
  need(filled(s.lede), "a lede");
  need(
    filled(s.problem) && sentences(s.problem) >= 2 && sentences(s.problem) <= 3,
    `the problem in two or three sentences (has ${filled(s.problem) ? sentences(s.problem) : 0})`,
  );
  need(filled(s.impactLine), "an impact line (the result in one line)");
  need(filled(s.facts?.role) && filled(s.facts?.team) && filled(s.facts?.time), "facts: role, team and time");
  const sm = s.summary;
  need(filled(sm?.brief), "summary: the brief");
  need(sm?.outcome?.length > 0 && sm.outcome.every((o) => filled(o.text)), "summary: the outcome");
  need(filled(sm?.role), "summary: my role");
  need(filled(sm?.teamLed), "summary: the team I led");
  need(sm?.putInPlace?.length > 0 && sm.putInPlace.every(filled), "summary: what I put in place");
  need(filled(sm?.keyDecision), "summary: the key decision");
  need(s.stages?.length === 6, `six stages (has ${s.stages?.length ?? 0})`);
  const ids = new Set<string>();
  s.stages?.forEach((st, i) => {
    need(filled(st.id) && !ids.has(st.id) && filled(st.nav), `stage ${i + 1}: a unique id and a short name`);
    ids.add(st.id);
    need(filled(st.finding), `stage ${i + 1}: its finding (the heading)`);
    need(st.blocks?.length > 0, `stage ${i + 1}: at least one block`);
  });
  const blocks = s.stages?.flatMap((st) => st.blocks) ?? [];
  const insights = blocks.filter((b) => b.kind === "insight").length;
  need(insights <= 1, `at most one key insight (has ${insights})`);
  const decisions = [...blocks.filter((b): b is Decision => b.kind === "decision"), ...(s.reversedDecision ? [s.reversedDecision] : [])];
  for (const d of decisions) {
    need(filled(d.title) && d.options?.length >= 2, `decision "${d.title}": a question and at least two options`);
    need(d.options?.filter((o) => o.status === "chosen").length === 1, `decision "${d.title}": exactly one chosen option`);
    d.options?.forEach((o) =>
      need(
        filled(o.label) && o.pros?.length > 0 && o.cons?.length > 0 && filled(o.cost),
        `decision "${d.title}", option "${o.label}": a label, pros, cons and a cost`,
      ),
    );
  }
  const reversed = s.reversedDecision?.options?.filter((o) => o.status === "reversed") ?? [];
  need(s.reversedDecision, "a decision we reversed");
  need(
    reversed.length === 1 && filled(reversed[0].turnedBack?.date) && filled(reversed[0].turnedBack?.text),
    "the reversed decision: one reversed option, with when and why we turned back",
  );
  need(
    blocks.every((b) => b.kind !== "decision" || b.options.every((o) => o.status !== "reversed")),
    "reversed options only in the decision we reversed",
  );
  need(
    filled(s.afterLaunch?.caption) && s.afterLaunch.entries?.length > 0 && s.afterLaunch.entries.every((e) => filled(e.date) && filled(e.text)),
    "after launch: a captioned, dated log",
  );
  need(filled(s.results?.caption) && s.results.rows?.length > 0, "results: a caption and at least one row");
  s.results?.rows?.forEach((r) =>
    need(
      filled(r.metric) && filled(r.before) && filled(r.after) && Number.isInteger(r.stage) && r.stage >= 1 && r.stage <= 6,
      `result "${r.metric}": before, after and the stage (1–6) it was won at`,
    ),
  );
  need(s.lookingBack?.length > 0, "looking back: at least one lesson");
  s.lookingBack?.forEach((l) =>
    need(filled(l.lesson) && /^Next time I would\b/.test(l.nextTime ?? ""), `lesson "${l.lesson}": what I would do next time ("Next time I would …")`),
  );
  need(
    s.team?.length > 0 && s.team.every((t) => filled(t.role) && filled(t.count) && filled(t.line)),
    "team: each role with its count and a line on what they did",
  );
  need(filled(s.didNotDo) && filled(s.credits), "what I did not do, and the credits");
  for (const b of blocks) if (b.kind === "figure") need(s.figures?.[b.id], `figure "${b.id}" is defined`);
  return out;
}
