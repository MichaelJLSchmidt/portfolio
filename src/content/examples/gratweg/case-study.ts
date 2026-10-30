import type { CaseStudy, ImageAsset } from "@/lib/case-study";
import { fillDeep } from "@/lib/fill";
import { data } from "./data";
import { figures, images } from "./figures";
import assets from "./images.json";

/**
 * Gratweg: a fictional model case study about a design system (platform leadership without
 * authority). Same fictional employer as Test Project and Seilschaft. Written with {{tokens}} into
 * data.ts; nothing here may spell out a number of its own (npm run check:figures).
 */
export const rawCaseStudy: CaseStudy = {
  example: true,
  banner: {
    label: "Model case study · Fictional example",
    text: "the organisation, people and figures are invented to show the format.",
  },
  lede: "One design system for {{landscape.products|word}} public-sector products, funded by a business case and adopted without a big-bang migration.",
  typeLine: "Platform · Design system · UX Team Lead · {{project.years}} years · {{years.start}}–{{years.end}} (fictional)",
  metaDescription: "Fictional model case study: a design system for a portfolio of public-sector products, in a UX leadership case study format.",
  summary: {
    mandate:
      "Nobody asked for a design system. The steering board asked why an accessibility audit failed {{landscape.auditFailed}} of {{landscape.products}} products; I answered with a platform proposal.",
    role: "Initiator and lead. I wrote the business case, set the governance, led the core team and ran adoption with {{landscape.products|word}} product teams.",
    teamLed:
      "A core team of {{team.core}} ({{team.designers|word}} designer, {{team.developers|word}} component developers) and {{team.contributors}} contributors from the product teams, none of whom reported to me.",
    putInPlace: [
      "A cost model",
      "An RFC process with a {{governance.rfcDays}}-day decision window",
      "A Figma-to-Angular token pipeline",
      "Office hours {{governance.officeHours}}",
      "A deprecation policy",
    ],
    keyDecision: "Build on Angular Material with our own tokens instead of a custom component library.",
    outcome: [
      { text: "Products on the system {{outcomes.products.before}} → {{outcomes.products.after}}", evidence: "measured" },
      { text: "Accessibility issues per audit {{audit.changePct}}%", evidence: "measured" },
      { text: "New product to first usable screen {{outcomes.firstScreen.beforeWeeks}} weeks → {{outcomes.firstScreen.afterDays}} days", evidence: "measured" },
      { text: "Developer time saved ≈ {{outcomes.hoursSaved|en}} hours a year", evidence: "estimated" },
    ],
    note: "Fictional example data.",
  },
  didNotDo: "I didn’t redesign the {{landscape.products|word}} products. Each team kept its roadmap; the system only changed what teams touched.",
  hero: "gw-hero",
  waypoints: [
    {
      id: "context",
      nav: "Context",
      label: "Context",
      finding: "{{landscape.products|word}} products, {{landscape.libraries|word}} libraries, {{landscape.blues|word}} blues",
      blocks: [
        {
          kind: "p",
          text: "{{landscape.products|Word}} citizen-facing products had grown up in {{landscape.products|word}} teams at Hochmatt Informatik. They used {{landscape.libraries|word}} UI libraries and {{landscape.blues|word}} shades of “primary” blue, and the date picker had been rebuilt {{landscape.datePickers|word}} times. An external audit failed {{landscape.auditFailed|word}} of the {{landscape.products|word}} against WCAG 2.1 AA. In usability tests, citizens assumed the services came from different authorities, and some abandoned a form because it “looked unofficial”.",
        },
        {
          kind: "p",
          text: "None of this was anyone’s fault. Each team had made sensible local choices under its own deadlines: a library a contractor knew, a blue that matched last year’s campaign, a date picker that worked well enough for its own form. The cost only showed up across the portfolio, where nobody was looking.",
        },
        {
          kind: "list",
          intro: "The landscape in {{years.start}}:",
          items: [
            "{{landscape.products|Word}} products, {{landscape.products|word}} teams, {{landscape.libraries|word}} UI libraries.",
            "{{landscape.blues|Word}} primary blues and {{landscape.datePickers|word}} date pickers.",
            "{{landscape.auditFailed|Word}} of {{landscape.products|word}} products failing WCAG 2.1 AA in an external audit.",
          ],
        },
        {
          kind: "p",
          text: "When the audit report reached the steering board, the question was narrow: why did these products fail, and who would fix them? Fixing them one by one was the obvious answer. It would also have meant fixing the same date picker {{landscape.auditFailed|word}} times.",
        },
      ],
    },
    {
      id: "leadership",
      nav: "Leadership",
      label: "Leadership",
      finding: "nobody owned it, so I asked to",
      blocks: [
        {
          kind: "p",
          text: "I had no mandate over the {{landscape.products|word}} teams, so the first deliverable was a coalition, not a component. {{coalition.leadDevelopers|Word}} lead developers, the accessibility officer and the Head of Digital Services co-signed a one-page proposal.",
        },
        {
          kind: "p",
          text: "The business case used the teams’ own numbers: about {{businessCase.datePickerHours}} hours spent rebuilding the same date picker. Nobody argues with their own timesheets. The steering board funded a {{pilot.months|word}}-month pilot with {{pilot.products|word}} products, with continuation tied to one adoption metric.",
        },
        {
          kind: "list",
          intro: "How the coalition came together:",
          items: [
            { lead: "One-to-ones first.", text: "I met each lead developer alone and asked what slowed their team down, before I mentioned a system at all." },
            { lead: "Their numbers, not mine.", text: "Each team counted its own rebuild hours; I only added them up." },
            { lead: "A shared signature.", text: "The proposal reached the board with {{coalition.signatories|word}} names on it, and I presented it with a lead developer beside me." },
          ],
        },
        { kind: "figure", id: "gw-coalition" },
        {
          kind: "p",
          text: "Leading without authority meant every agreement had to be worth more to a team than it cost them. I chose the pilot products by pain, not by prestige: the ones with the most failed audit criteria and a release due anyway. If the system could help there, under pressure, the other teams would hear about it from their peers rather than from me.",
        },
      ],
    },
    {
      id: "discovery",
      nav: "Discovery",
      label: "Discovery",
      finding: "teams wanted fewer decisions, not fewer components",
      blocks: [
        {
          kind: "p",
          text: "We inventoried {{inventory.instances|en}} UI instances across the {{landscape.products|word}} products and found {{inventory.patterns}} distinct patterns; {{inventory.core}} of them covered {{inventory.coverPct}}% of all screens.",
        },
        {
          kind: "p",
          text: "The inventory was a team effort. Each product team screenshotted its own flows in one afternoon, and we sorted the prints on the floor of a meeting room. Seeing {{landscape.datePickers|word}} date pickers lined up side by side did more for the proposal than any slide.",
        },
        { kind: "figure", id: "gw-pareto" },
        {
          kind: "p",
          text: "Developer interviews changed the brief: what slowed teams down wasn’t writing components, it was deciding how they should behave. Where does the error message go? What does the date picker do with a public holiday? Does the button say “Next” or “Continue”? Every team had answered these questions on its own, at least once, usually in a sprint review with the wrong people in the room.",
        },
        { kind: "insight", text: "A design system is a set of decisions that ships. The components only carry them." },
        {
          kind: "p",
          text: "So the first version shipped {{v1.components}} components with their decisions written down, not {{inventory.patterns}} components without them. Each one came with a short page: when to use it, when not to, what it does for keyboard and screen-reader users, and which questions it settles so a team doesn’t have to.",
        },
      ],
    },
    {
      id: "decisions",
      nav: "Decisions",
      label: "Decisions",
      finding: "{{decisions.count|word}} calls that made it stick",
      blocks: [
        {
          kind: "decision",
          id: "foundation",
          title: "What do we build on?",
          text: ["{{landscape.onMaterial|Word}} of the {{landscape.products|word}} products already used Angular Material somewhere, usually beside a second library."],
          options: {
            caption: "Three foundations for the system",
            columns: ["Option", "Gain", "Cost"],
            rows: [
              {
                option: "Custom component library",
                pro: "Full control",
                con: "{{decisions.customYears|Word}} years before anyone benefits, and we maintain everything",
              },
              { option: "Commercial kit", pro: "Fast start", con: "Licence cost and a second visual language" },
              {
                option: "Angular Material + our own tokens",
                pro: "Teams already use it, and accessibility comes built in",
                con: "Some brand compromises where Material is opinionated",
                chosen: true,
              },
            ],
          },
          chose: "Angular Material with our own tokens.",
          cost: "Some brand compromises where Material is opinionated, such as its focus ring and its dense tables.",
          mitigation: "We wrote each compromise down with its reason, and the brand team signed the list once instead of reviewing every screen.",
        },
        { kind: "figure", id: "gw-options" },
        {
          kind: "decision",
          id: "ownership",
          title: "Who builds what?",
          options: {
            caption: "Three ways to share the work",
            columns: ["Option", "Gain", "Cost"],
            rows: [
              { option: "The core team builds everything", pro: "Consistent", con: "A bottleneck from week one" },
              { option: "Open contribution with no owner", pro: "Fast", con: "{{landscape.blues|Word}} blues again within a year" },
              {
                option: "The core team owns, contributors propose via RFC",
                pro: "Shared ownership with a clear decision-maker",
                con: "Process overhead, which we had to trim later",
                chosen: true,
              },
            ],
          },
          chose: "The core team owns the system; contributors propose changes on a one-page RFC.",
          cost: "Process overhead: at first we required an RFC even for a new icon, and contributions dropped.",
          mitigation:
            "A fast lane for small changes, decided within {{governance.fastLaneDays|word}} days, and a {{governance.rfcDays}}-day decision window for the rest, so no proposal waits in silence.",
        },
        { kind: "figure", id: "gw-governance" },
        {
          kind: "decision",
          id: "migration",
          title: "How do teams migrate?",
          options: {
            caption: "Three ways to move onto the system",
            columns: ["Option", "Gain", "Cost"],
            rows: [
              { option: "Big-bang migration", pro: "Clean in one go", con: "Freezes {{landscape.products|word}} roadmaps, and nobody would fund it" },
              { option: "Optional forever", pro: "No friction", con: "Adoption stalls at the enthusiasts" },
              {
                option: "“Touch it, migrate it”",
                pro: "Every screen a team changes moves to the system",
                con: "Mixed screens for a while, visible to users",
                chosen: true,
              },
            ],
          },
          chose: "“Touch it, migrate it”: every screen a team changes for its own reasons moves to the system.",
          cost: "Mixed screens for a while, visible to users.",
          mitigation: "The tokens went in first, everywhere at once, so colour and type matched even where the components didn’t yet.",
        },
      ],
    },
    {
      id: "delivery",
      nav: "Delivery",
      label: "Delivery",
      finding: "the pipeline is the promise",
      blocks: [
        {
          kind: "p",
          text: "Designers change a token in Figma; CI reads it with a read-only key, Style Dictionary builds the Angular Material theme, and teams update one package. Nobody edits colours by hand again, which made the brand team an ally instead of a reviewer.",
        },
        { kind: "figure", id: "gw-pipeline" },
        {
          kind: "p",
          text: "Release notes are written for product owners, not developers. Each one starts with what changes for a citizen, then what a team has to do, then the code. Product owners began forwarding them to their own stakeholders, which did more for adoption than any mandate could have.",
        },
        {
          kind: "p",
          text: "Office hours run {{governance.officeHours}}, and an adoption dashboard shows every team where it stands. Contributors came to office hours with a branch rather than a question, and most left with a merged change. The {{team.contributors}} contributors never reported to me; what kept them contributing was seeing their name in the release notes and their fix in {{landscape.products|word}} products at once.",
        },
        { kind: "figure", id: "gw-adoption" },
        {
          kind: "p",
          text: "A deprecation policy kept the system honest. A component is retired with a release note, a replacement and a date, and stays supported for {{governance.deprecationMonths|word}} months. Teams that touch a deprecated screen move it; teams that don’t get a reminder from the dashboard, not from me.",
        },
      ],
    },
    {
      id: "outcome",
      nav: "Outcome",
      label: "Outcome & reflection",
      finding: "the ridge held",
      blocks: [
        {
          kind: "metrics",
          label: "Outcomes at a glance",
          items: [
            {
              value: "{{outcomes.products.after}} of {{landscape.products}}",
              label: "products on the system",
              detail: "from {{outcomes.products.before}}",
              evidence: "measured",
            },
            {
              value: "{{audit.changePct}}%",
              label: "accessibility issues per audit",
              detail: "{{audit.totalBefore}} → {{audit.totalAfter}} across all products",
              evidence: "measured",
            },
            {
              value: "{{outcomes.firstScreen.afterDays}} days",
              label: "from new product to first usable screen",
              detail: "from {{outcomes.firstScreen.beforeWeeks|word}} weeks",
              evidence: "measured",
            },
          ],
        },
        {
          kind: "outcomes",
          caption: "Outcomes — fictional example data",
          legend: {
            measured: "dependency scans, audit reports and team logs, {{years.start}}–{{years.end}}",
            estimated: "extrapolated from the teams’ own rebuild hours",
          },
          rows: [
            {
              metric: "Products on the system",
              before: "{{outcomes.products.before}} of {{landscape.products}}",
              after: "{{outcomes.products.after}} of {{landscape.products}}",
              evidence: "measured",
            },
            {
              metric: "Accessibility issues per audit",
              before: "baseline ({{audit.totalBefore}})",
              after: "{{audit.changePct}}% ({{audit.totalAfter}})",
              evidence: "measured",
            },
            {
              metric: "New product to first usable screen",
              before: "{{outcomes.firstScreen.beforeWeeks}} weeks",
              after: "{{outcomes.firstScreen.afterDays}} days",
              evidence: "measured",
            },
            { metric: "Developer time saved per year", before: "—", after: "≈ {{outcomes.hoursSaved|en}} h", evidence: "estimated" },
          ],
        },
        { kind: "figure", id: "gw-a11y-chart" },
        { kind: "figure", id: "gw-before-after" },
        {
          kind: "p",
          lead: "What did not improve:",
          text: "French date and number formats still differ between products whose back ends format them before the front end sees them. The system can’t fix data it never receives raw.",
        },
        {
          kind: "list",
          intro: "Reflection:",
          items: [
            { lead: "Governance was too heavy at first.", text: "We required an RFC for a new icon; contributions dropped until we added a fast lane." },
            {
              lead: "Brand came in late.",
              text: "{{reflection.tokenRounds|Word}} token rounds would have been one if the brand team had joined before the first release.",
            },
            {
              lead: "Measure adoption automatically from day one.",
              text: "We counted by hand for {{outcomes.countedByHandMonths|word}} months and argued about the numbers.",
            },
          ],
        },
      ],
    },
  ],
  credits:
    "Credits (fictional): core team of {{team.designers|word}} designer and {{team.developers|word}} component developers; {{team.contributors}} contributors from product teams; the accessibility officer; sponsor — Head of Digital Services.",
  figures,
  images,
};

export const caseStudy: CaseStudy = { ...fillDeep(rawCaseStudy, data), assets: assets as Record<string, ImageAsset> };
