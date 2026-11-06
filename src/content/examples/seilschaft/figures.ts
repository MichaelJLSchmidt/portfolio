import type { FigureSpec, ImageSpec } from "@/lib/case-study";

/**
 * Seilschaft figures: what each image is, how the page shows it, and its words (alt text,
 * caption, long description). Images are rendered from artefacts/seilschaft by `npm run images`,
 * at the master size given here (2x); numbers are {{tokens}} into data.ts. Figure numbers follow
 * the order of appearance on the page.
 */
export const images: Record<string, ImageSpec> = {
  "sl-hero": {
    alt: "Team topology before and after. Before: {{team.start|word}} designers behind one ticket queue for {{org.productTeams}} product teams. After: a hub of {{team.end|word}} people, each designer seated in a product cluster.",
    width: 2560,
    height: 1440,
  },
  "sl-steering-onepager": {
    alt: "One-page proposal to the steering board: the problem in the team’s own ticket data, a staged ask of {{ask.yearOneHires|word}} hires each tied to a milestone, and a review at month {{ask.reviewMonths|word}}.",
    width: 1600,
    height: 1200,
  },
  "sl-interviews": {
    alt: "Interview synthesis of {{interviews.productOwners}} product owners; {{interviews.earlier}} are marked as willing to involve UX earlier if it were predictable, grouped by what held them back.",
    width: 2400,
    height: 1200,
  },
  "sl-scorecard": {
    alt: "Hiring scorecard for the work-sample interview: {{hiring.criteria|word}} criteria, each with what weak and strong evidence looks like, scored by a panel of {{hiring.panel|word}}.",
    width: 1600,
    height: 1040,
  },
  "sl-intake-board": {
    alt: "Intake board with {{intake.tiers|word}} columns, Explore, Shape and Polish, each with its entry rule; the Polish column carries a {{intake.polishDays|word}}-day cap and the reason for it.",
    width: 2400,
    height: 1200,
  },
  "sl-rituals": {
    alt: "Rituals calendar for one quarter: crit every week, a research day every month and a showcase at the end of the quarter.",
    width: 2400,
    height: 1080,
  },
  "sl-onboarding": {
    alt: "Onboarding trail over {{onboarding.third}} days in stages of {{onboarding.first}} days, each ending with something the new hire has shipped.",
    width: 2400,
    height: 800,
  },
  "sl-ladder": {
    alt: "Career ladder excerpt: {{ladder.levels|word}} levels from Designer to Lead, each with example behaviours for planning, collaboration and what they leave behind.",
    width: 2400,
    height: 1000,
  },
  "sl-requests-chart": {
    alt: "Line chart of the share of requests that reached UX before development, per quarter: from {{requests.before}}% in {{years.start}} to {{requests.after}}% in {{years.end}}.",
    width: 1920,
    height: 1080,
  },
  "sl-designers-chart": {
    alt: "Step chart of product teams with a named designer, every half year: from {{named.before}} of {{org.productTeams}} to {{named.after}} of {{org.productTeams}}.",
    width: 1920,
    height: 1080,
  },
};

export const figures: Record<string, FigureSpec> = {
  "sl-hero": { kind: "image", image: "sl-hero", surface: "night", size: "wide", source: "Team structure, {{years.start}} and {{years.end}} (fictional)" },
  "sl-steering-onepager": {
    kind: "image",
    image: "sl-steering-onepager",
    source: "Steering-board proposal, {{years.start}} (fictional)",
    surface: "sheet",
    size: "column",
    zoom: true,
    caption: "The steering-board one-pager. Staging the ask turned the budget into a decision about evidence.",
    long: [
      {
        text: "The problem, from our own tickets ({{years.start}})",
        items: [
          "Requests arriving {{desk.lateWeeks|word}} weeks or less before release, most of them visual.",
          "{{desk.reworkHours}} hours of rework after release in one year.",
          "{{desk.neverMet}} of {{org.productTeams}} product teams had never met a designer.",
        ],
      },
      {
        text: "The staged ask",
        items: [
          "Year one: {{ask.yearOneHires|word}} hires, each tied to one milestone.",
          "Milestone: one intake for every request within {{ask.intakeMonths|word}} months.",
          "Milestone: a named designer for the {{ask.firstTeams|word}} teams with the most citizen traffic.",
          "Review at month {{ask.reviewMonths|word}}: grow, or stop where we are.",
        ],
      },
      "Signed off by the Head of Digital Services.",
    ],
  },
  "sl-interviews": {
    kind: "image",
    image: "sl-interviews",
    source: "Product-owner interviews (fictional)",
    surface: "sheet",
    size: "wide",
    zoom: true,
    caption: "{{interviews.productOwners}} product owners interviewed. {{interviews.earlier|Word}} would involve UX earlier if they knew what they would get and when.",
    long: [
      {
        text: "Would involve UX earlier ({{interviews.earlier}})",
        items: [
          "No slot in the quarterly plan: UX arrives as a favour at the end.",
          "Scope fear: an early conversation might change what the team promised.",
          "No name: nobody knows which designer will pick the work up.",
        ],
      },
      {
        text: "Would not ({{interviews.notEarlier}})",
        items: ["Internal tools with few users: little to gain ({{interviews.internalTools}}).", "Wants fewer meetings (one)."],
      },
    ],
  },
  "sl-scorecard": {
    kind: "image",
    image: "sl-scorecard",
    source: "Hiring scorecard (fictional)",
    surface: "sheet",
    size: "column",
    zoom: true,
    caption: "The work-sample scorecard. Scoring the same criteria made the panel argue about evidence, not impressions.",
    long: [
      "A paid {{hiring.workSampleHours|word}}-hour session on a real, anonymised request; a panel of {{hiring.panel|word}} scores each criterion from weak to strong.",
      {
        text: "Criteria",
        items: [
          "Framing: restates the problem and names what is unknown.",
          "Evidence: asks for data and users before proposing screens.",
          "Collaboration: brings the product owner and a developer into the work.",
          "Craft: a clear, accessible flow at the right fidelity.",
          "Reflection: names the weakest part of their own proposal.",
        ],
      },
    ],
  },
  "sl-intake-board": {
    kind: "image",
    image: "sl-intake-board",
    source: "Team intake board (fictional)",
    surface: "sheet",
    size: "wide",
    zoom: true,
    caption: "The intake board. The Polish tier’s {{intake.polishDays|word}}-day cap is printed on the tier, with the reason beside it.",
    long: [
      { text: "Explore", items: ["Entry rule: the problem is not yet clear, or no one has asked users.", "Research and concept, planned a quarter ahead."] },
      { text: "Shape", items: ["Entry rule: the problem is clear and the team has a release window.", "Design with the team, sprint by sprint."] },
      {
        text: "Polish",
        items: [
          "Entry rule: the flow stays as it is; only the screen changes.",
          "{{intake.polishDays|Word}} days at most, from templates.",
          "Why the cap: so a quick fix never quietly becomes a redesign.",
        ],
      },
      "Every card names its team and cluster; a column of declined requests says why each was declined.",
    ],
  },
  "sl-rituals": {
    kind: "image",
    image: "sl-rituals",
    source: "Team calendar (fictional)",
    surface: "sheet",
    size: "wide",
    caption: "The team’s rhythm: weekly crit, a monthly research day and a quarterly showcase. Nothing else may book these slots.",
  },
  "sl-onboarding": {
    kind: "image",
    image: "sl-onboarding",
    source: "Onboarding plan (fictional)",
    surface: "sheet",
    size: "wide",
    caption: "The onboarding trail. Each stage ends with something the new hire has shipped, not read.",
  },
  "sl-ladder": {
    kind: "image",
    image: "sl-ladder",
    source: "Career ladder, written with HR (fictional)",
    surface: "sheet",
    size: "wide",
    zoom: true,
    caption: "Career ladder excerpt. Example behaviours, not titles, made the levels hold up in salary reviews.",
    long: [
      {
        text: "Planning horizon",
        items: ["Designer: plans the task in front of them.", "Senior designer: plans a release.", "Principal designer: plans a quarter across teams.", "Lead: plans the practice a year ahead."],
      },
      {
        text: "Collaboration",
        items: [
          "Designer: works with their product owner.",
          "Senior designer: brings developers and research in early.",
          "Principal designer: aligns several teams on one pattern.",
          "Lead: aligns units outside product.",
        ],
      },
      {
        text: "Leaves behind",
        items: ["Designer: a shipped screen.", "Senior designer: a documented pattern.", "Principal designer: a standard others use.", "Lead: a team that works without them."],
      },
    ],
  },
  "sl-requests-chart": {
    kind: "image",
    image: "sl-requests-chart",
    source: "Team intake log, {{years.start}}–{{years.end}} (fictional data)",
    surface: "night",
    size: "column",
    caption: "Share of requests reaching UX before development, per quarter. The intake made demand visible; the clusters moved it earlier.",
  },
  "sl-designers-chart": {
    kind: "image",
    image: "sl-designers-chart",
    source: "Team assignments, {{years.start}}–{{years.end}} (fictional data)",
    surface: "night",
    size: "column",
    caption: "Product teams with a named designer, every half year. Each new seat went to a cluster, not a ticket.",
  },
};
