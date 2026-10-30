/**
 * The case-study content model: what a page under /work/<slug>/ is built from. Copy lives in
 * src/content (case-studies.ts and src/content/examples); components in
 * src/components/case-study render it. Every case study uses the same building blocks:
 *
 * - six or so waypoints, each headed "Label — finding" (the heading states what was found);
 * - blocks inside a waypoint: paragraphs, lists, figures, one key insight, decisions (h3,
 *   options table, chose / cost / mitigation), metric tiles and outcome tables with evidence
 *   badges. No quotes or testimonials.
 */

/** How a number was obtained. Shown as shape plus text, never colour alone. */
export type Evidence = "measured" | "estimated" | "qualitative";

/** A list item: plain text, or a bold lead-in followed by text. */
export type ListItem = string | { lead: string; text: string };

/** Long description of a complex diagram, as a nested list. */
export type LongDescription = (string | { text: string; items: LongDescription })[];

export type OptionsTable = {
  caption: string;
  columns: readonly [string, string, string];
  rows: { option: string; pro: string; con: string; chosen?: boolean }[];
};

export type Decision = {
  kind: "decision";
  id: string;
  /** The question, e.g. "Who applies?"; the h3 reads "Decision 1 — Who applies?" (numbered in order). */
  title: string;
  text?: string[];
  options?: OptionsTable;
  chose: string;
  cost: string;
  mitigation: string;
  /** A closing sentence after chose / cost / mitigation. */
  after?: string;
};

export type Metric = { label: string; value: string; detail?: string; evidence: Evidence };

export type OutcomeRow = { metric: string; before: string; after: string; evidence: Evidence; note?: string };

export type Block =
  | { kind: "p"; text: string; lead?: string }
  | { kind: "list"; intro?: string; items: ListItem[]; ordered?: boolean }
  /** A figure from the case study's `figures`, numbered in order of appearance. */
  | { kind: "figure"; id: string }
  /** The one key insight of the page (an aside with a visible label). */
  | { kind: "insight"; text: string }
  | Decision
  | { kind: "metrics"; label: string; items: Metric[] }
  /** Outcome table; `legend` says what each evidence kind means here (the legend shows them). */
  | { kind: "outcomes"; caption: string; legend?: Partial<Record<Evidence, string>>; rows: OutcomeRow[] };

export type Waypoint = {
  id: string;
  /** Short name for "Jump to" and "On this page". */
  nav: string;
  /** Heading label, e.g. "Context & constraints". */
  label: string;
  /** What this part found; the heading reads "label — finding". */
  finding?: string;
  blocks: Block[];
};

export type OutcomeItem = { text: string; evidence: Evidence };

export type FigureSurface = "sheet" | "night";

type FigureBase = {
  /** "What it shows. Why it matters." The component prefixes "Fig. n — ". */
  caption?: string;
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
  | (FigureBase & { kind: "hotspots"; image: string; notes: { title: string; text: string }[] });

/** One encoded image, from the manifest the pipeline writes. */
export type ImageAsset = {
  width: number;
  height: number;
  /** Tiny blurred WebP as a data URI, shown until the image has loaded. */
  placeholder: string;
  sources: { format: "avif" | "webp"; width: number; src: string; bytes: number }[];
  /** Marker positions as fractions of the image box (hotspot figures). */
  hotspots?: { n: number; x: number; y: number }[];
};

export type CaseStudy = {
  /** Fictional example: banner, noindex, never in a live build (src/content/examples). */
  example?: true;
  /** The deck line under the H1. */
  lede: string;
  /** "Service design · Public sector · …"; the card's type line when absent. */
  typeLine?: string;
  /** Meta description; the lede when absent. */
  metaDescription?: string;
  /** Shown above the H1 on flagged examples. */
  banner?: { label: string; text: string };
  /**
   * The Summit summary, the page in six rows for a reader who skims: mandate · my role · team I
   * led · what I put in place · key decision · outcome. A row without a value is left out.
   */
  summary: {
    /** What was asked for, and how I reframed it. */
    mandate?: string;
    role?: string;
    /** Whom I led: direct reports, the wider team, people I led without authority. */
    teamLed?: string;
    /** The structures I left behind (rituals, processes, systems), one item each. */
    putInPlace?: string[];
    keyDecision?: string;
    outcome?: string | OutcomeItem[];
    /** A closing line, e.g. "Fictional example data." */
    note?: string;
  };
  /** One honest line on the scope I did not own; shown before the credits. */
  didNotDo: string;
  /** Figure id of the product hero, shown directly after the Summit summary. */
  hero?: string;
  waypoints: Waypoint[];
  credits: string;
  figures?: Record<string, FigureSpec>;
  images?: Record<string, ImageSpec>;
  /** Encoded images by id (generated manifest). */
  assets?: Record<string, ImageAsset>;
};

/** Figure numbers in order of appearance; the hero is not numbered. */
export function figureNumbers(study: Pick<CaseStudy, "waypoints">): Map<string, number> {
  const numbers = new Map<string, number>();
  for (const w of study.waypoints) for (const b of w.blocks) if (b.kind === "figure" && !numbers.has(b.id)) numbers.set(b.id, numbers.size + 1);
  return numbers;
}

/** Decision numbers in order of appearance. */
export function decisionNumbers(study: Pick<CaseStudy, "waypoints">): Map<string, number> {
  const numbers = new Map<string, number>();
  for (const w of study.waypoints) for (const b of w.blocks) if (b.kind === "decision") numbers.set(b.id, numbers.size + 1);
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

/** The page's running text, waypoint by waypoint (headings, blocks and figure captions). */
export function bodyText(study: Pick<CaseStudy, "waypoints" | "figures" | "credits" | "didNotDo">): string[] {
  const parts: string[] = [];
  for (const w of study.waypoints) {
    parts.push(w.label, w.finding ?? "");
    for (const b of w.blocks) {
      switch (b.kind) {
        case "p":
          parts.push(b.lead ?? "", b.text);
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
          parts.push(b.title, ...(b.text ?? []), b.chose, b.cost, b.mitigation, b.after ?? "");
          if (b.options) parts.push(...b.options.rows.flatMap((r) => [r.option, r.pro, r.con]));
          break;
        case "metrics":
          parts.push(...b.items.flatMap((m) => [m.value, m.label, m.detail ?? ""]));
          break;
        case "outcomes":
          parts.push(...Object.values(b.legend ?? {}), ...b.rows.flatMap((r) => [r.metric, r.before, r.after, r.note ?? ""]));
          break;
      }
    }
  }
  parts.push(study.didNotDo, study.credits);
  return parts.filter(Boolean);
}

/**
 * Reading time in whole minutes, the way Medium counts it: the body's words at 265 words a minute,
 * plus 12 s for the first figure and a second less for each one after, down to 3 s.
 */
export function readingMinutes(study: Pick<CaseStudy, "waypoints" | "figures" | "credits" | "didNotDo">): number {
  const words = bodyText(study).join(" ").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const figures = figureNumbers(study).size;
  const looking = Array.from({ length: figures }, (_, i) => Math.max(3, 12 - i)).reduce((a, b) => a + b, 0);
  return Math.max(1, Math.round(words / 265 + looking / 60));
}
