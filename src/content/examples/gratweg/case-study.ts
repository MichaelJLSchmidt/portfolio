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
  lede: "One design system for {{landscape.products|word}} public-sector products, funded by a business case and adopted without a big-bang migration.",
  typeLine: "Platform · Design system · UX Team Lead · {{project.years}} years · {{years.start}}–{{years.end}} (fictional)",
  metaDescription: "Fictional model case study: a design system for a portfolio of public-sector products, in a UX leadership case study format.",
  problem:
    "{{landscape.products|Word}} public-sector products had grown up in separate teams, with {{landscape.libraries|word}} UI libraries and {{landscape.blues|word}} shades of primary blue. An external audit failed {{landscape.auditFailed|word}} of them against WCAG 2.1 AA, and citizens in usability tests thought the services came from different authorities. Nobody owned the problem across the portfolio.",
  impactLine: "All {{landscape.products|word}} products on one design system within {{project.years|word}} years, with accessibility issues per audit cut by almost two thirds.",
  facts: {
    role: "UX team lead · initiator",
    team: "{{team.core}} core + {{team.contributors}} contributors",
    time: "{{project.years}} years · {{years.start}}–{{years.end}}",
  },
  summary: {
    brief:
      "Nobody asked for a design system. The steering board asked why an accessibility audit failed {{landscape.auditFailed}} of {{landscape.products}} products; I answered with a platform proposal.",
    outcome: [
      { text: "Products on the system {{outcomes.products.before}} → {{outcomes.products.after}}", evidence: "measured" },
      { text: "Accessibility issues per audit {{audit.changePct}}%", evidence: "measured" },
      { text: "New product to first usable screen {{outcomes.firstScreen.beforeWeeks}} weeks → {{outcomes.firstScreen.afterDays}} days", evidence: "measured" },
      { text: "Developer time saved ≈ {{outcomes.hoursSaved|en}} hours a year", evidence: "estimated" },
    ],
    role: "Initiator and lead. I wrote the business case, set the governance, led the core team and ran adoption with {{landscape.products|word}} product teams.",
    teamLed:
      "A core team of {{team.core}} ({{team.designers|word}} designer, {{team.developers|word}} component developers) and {{team.contributors}} contributors from the product teams, none of whom reported to me.",
    putInPlace: [
      "A cost model",
      "An RFC process with a {{governance.rfcDays}}-day decision window and a fast lane for small changes",
      "A Figma-to-Angular token pipeline",
      "Office hours {{governance.officeHours}}",
      "A deprecation policy",
    ],
    keyDecision: "Build on Angular Material with our own tokens instead of a custom component library.",
    note: "Fictional example data.",
  },
  didNotDo: "I didn’t redesign the {{landscape.products|word}} products. Each team kept its roadmap; the system only changed what teams touched.",
  hero: "gw-hero",
  stages: [
    {
      id: "context",
      nav: "Context",
      finding:
        "{{landscape.products|Word}} products had grown {{landscape.libraries|word}} UI libraries and {{landscape.blues|word}} shades of blue, and {{landscape.auditFailed|word}} of them failed an accessibility audit.",
      blocks: [
        {
          kind: "p",
          text: "{{landscape.products|Word}} citizen-facing products had grown up in {{landscape.products|word}} teams at Hochmatt Informatik. They used {{landscape.libraries|word}} UI libraries and {{landscape.blues|word}} shades of primary blue, and the date picker had been rebuilt {{landscape.datePickers|word}} times. An external audit failed {{landscape.auditFailed|word}} of the {{landscape.products|word}} against WCAG 2.1 AA. In usability tests, citizens assumed the services came from different authorities, and some abandoned a form because it looked unofficial to them.",
        },
        {
          kind: "p",
          text: "None of this was anyone’s fault. Each team had made sensible local choices under its own deadlines: a library a contractor knew, a blue that matched last year’s campaign, a date picker that worked well enough for its own form. The cost only showed up across the portfolio, where nobody was looking.",
          note: "Each choice was sensible on its own; only the portfolio view showed what it cost.",
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
      finding: "Nobody owned consistency across the products, so I asked to, backed by a coalition and the teams’ own numbers.",
      blocks: [
        {
          kind: "p",
          text: "I had no mandate over the {{landscape.products|word}} teams, so the first deliverable was a coalition, not a component. {{coalition.leadDevelopers|Word}} lead developers, the accessibility officer and the Head of Digital Services co-signed a one-page proposal.",
        },
        {
          kind: "p",
          text: "The business case used the teams’ own numbers: about {{businessCase.datePickerHours}} hours spent rebuilding the same date picker. Nobody argues with their own timesheets. The steering board funded a {{pilot.months|word}}-month pilot with {{pilot.products|word}} products, with continuation tied to one adoption metric.",
          note: "The one metric for continuing: both pilot products ship a release on the system.",
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
      finding: "Teams wanted fewer decisions to make, not fewer components.",
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
      finding: "{{decisions.count|Word}} decisions made the system stick: what to build on, who builds what, and how teams migrate.",
      blocks: [
        {
          kind: "decision",
          id: "foundation",
          title: "What do we build on?",
          text: ["{{landscape.onMaterial|Word}} of the {{landscape.products|word}} products already used Angular Material somewhere, usually beside a second library."],
          options: [
            {
              label: "Custom component library",
              pros: ["Full control", "A perfect brand fit"],
              cons: ["{{decisions.customYears|Word}} years before anyone benefits", "We maintain everything"],
              cost: "{{decisions.customYears|signed}} years to the first release",
              status: "rejected",
            },
            {
              label: "Commercial kit",
              pros: ["Fast start"],
              cons: ["A second visual language", "Accessibility varies by component"],
              cost: "A licence for every product, every year",
              status: "rejected",
            },
            {
              label: "Angular Material + our own tokens",
              pros: ["Teams already use it", "Accessibility comes built in"],
              cons: ["Some brand compromises where Material is opinionated"],
              cost: "Brand compromises: focus ring, dense tables",
              status: "chosen",
            },
          ],
          after: "We carried the cost by writing each compromise down with its reason; the brand team signed the list once instead of reviewing every screen.",
        },
        { kind: "figure", id: "gw-options" },
        {
          kind: "decision",
          id: "ownership",
          title: "Who builds what?",
          options: [
            {
              label: "The core team builds everything",
              pros: ["Consistent"],
              cons: ["A bottleneck from week one"],
              cost: "{{decisions.coreOnlyHires|Word}} more developers",
              status: "rejected",
            },
            {
              label: "Open contribution with no owner",
              pros: ["Fast", "No central team to fund"],
              cons: ["{{landscape.blues|Word}} blues again within a year"],
              cost: "Consistency, within a year",
              status: "rejected",
            },
            {
              label: "The core team owns, contributors propose via RFC",
              pros: ["Shared ownership with a clear decision-maker"],
              cons: ["Process overhead, which we had to trim later"],
              cost: "Process overhead on every change",
              status: "chosen",
            },
          ],
          after:
            "We carried the cost with a {{governance.rfcDays}}-day decision window, so no proposal waits in silence, and later a fast lane that decides small changes within {{governance.fastLaneDays|word}} days.",
        },
        { kind: "figure", id: "gw-governance" },
        {
          kind: "decision",
          id: "migration",
          title: "How do teams migrate?",
          options: [
            {
              label: "Big-bang migration",
              pros: ["Clean in one go"],
              cons: ["Freezes {{landscape.products|word}} roadmaps", "Nobody would fund it"],
              cost: "Every roadmap frozen for months",
              status: "rejected",
            },
            {
              label: "Optional forever",
              pros: ["No friction"],
              cons: ["Adoption stalls at the enthusiasts"],
              cost: "Most products never move",
              status: "rejected",
            },
            {
              label: "“Touch it, migrate it”",
              pros: ["Every screen a team changes moves to the system", "No roadmap stops"],
              cons: ["Mixed screens for a while, visible to users"],
              cost: "Mixed screens for a while",
              status: "chosen",
            },
          ],
          after: "We carried the cost by shipping the tokens first, everywhere at once, so colour and type matched even where the components didn’t yet.",
        },
      ],
    },
    {
      id: "delivery",
      nav: "Delivery",
      finding: "A token pipeline and release notes for product owners kept every product in step without a mandate.",
      blocks: [
        {
          kind: "p",
          text: "Designers change a token in Figma; CI reads it with a read-only key, Style Dictionary builds the Angular Material theme, and teams update one package. Nobody edits colours by hand again, which made the brand team an ally instead of a reviewer.",
          note: "The key is read-only, so CI can read the design file but never change it.",
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
          note: "Retirement dates sit in the adoption dashboard, so reminders come from data, not from a person.",
        },
      ],
    },
    {
      id: "outcome",
      nav: "Outcome",
      finding: "All {{landscape.products|word}} products moved onto the system, and accessibility issues per audit fell by almost two thirds.",
      blocks: [
        {
          kind: "p",
          text: "By {{log.allOn}}, every product was on the system, and no team had stopped its roadmap to get there. The external audit gave the clearest measure: accessibility issues across the products fell from {{audit.totalBefore}} to {{audit.totalAfter}}.",
        },
        { kind: "figure", id: "gw-a11y-chart" },
        { kind: "figure", id: "gw-before-after" },
        {
          kind: "p",
          lead: "What did not improve:",
          text: "French date and number formats still differ between products whose back ends format them before the front end sees them. The system can’t fix data it never receives raw.",
        },
      ],
    },
  ],
  reversedDecision: {
    kind: "decision",
    id: "governance",
    title: "How much process does a change need?",
    text: ["At launch, every change to the system needed a one-page RFC and a decision within {{governance.rfcDays}} days, from a new component to a new icon."],
    options: [
      {
        label: "An RFC for every change",
        pros: ["Every change written down and reviewed", "One rule, easy to explain"],
        cons: ["Small fixes waited weeks", "Teams forked components rather than wait"],
        cost: "Weeks per small fix",
        status: "reversed",
        turnedBack: {
          date: "{{log.fastLane}}",
          text: "Small fixes, such as an icon or a token value, waited weeks for a decision. Contributions dropped, and {{reversal.forks|word}} teams forked components to ship on time.",
        },
      },
      {
        label: "A fast lane for small changes, RFCs for breaking ones",
        pros: ["Small fixes decided within {{governance.fastLaneDays|word}} days", "Breaking changes still get a full review"],
        cons: ["Someone has to judge what counts as small"],
        cost: "One core-team member on call",
        status: "chosen",
      },
      {
        label: "No RFCs at all",
        pros: ["Nothing waits"],
        cons: ["Breaking changes reach products unannounced"],
        cost: "The product teams’ trust",
        status: "rejected",
      },
    ],
    after: "We carried the cost of judging with a written list of what counts as small: an icon, a token value, a fix that changes no API.",
  },
  afterLaunch: {
    caption: "What we observed after version one shipped in {{log.launch}}, newest first (fictional).",
    entries: [
      {
        date: "{{log.allOn}}",
        text: "Package downloads showed the last product on the system: {{outcomes.products.after}} of {{landscape.products}}, without a migration project.",
      },
      {
        date: "{{log.release2}}",
        text: "Version two added the address and payment patterns. In the usability test that followed, {{release2.completedAfter}} of {{release2.participants}} citizens completed the address form without help, against {{release2.completedBefore}} of {{release2.participants}} in the {{years.testNote}} test.",
      },
      {
        date: "{{log.fix}}",
        text: "After a fast-lane fix, tickets about date entry fell to {{support.ticketsAfter|word}} a week, and analytics showed the date step completed as often as before the update.",
      },
      {
        date: "{{log.hiccup}}",
        text: "A date-picker update stopped people typing a date with the keyboard; the support desk logged {{support.tickets}} tickets about it in the first week.",
      },
      {
        date: "{{log.firstScreen}}",
        text: "The first team to start a new service on the system reached a usable screen in {{outcomes.firstScreen.afterDays}} days; the last one built without it took {{outcomes.firstScreen.beforeWeeks|word}} weeks.",
      },
    ],
  },
  results: {
    caption: "Results — fictional example data",
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
        stage: 5,
      },
      {
        metric: "Accessibility issues per audit",
        before: "baseline ({{audit.totalBefore}})",
        after: "{{audit.changePct}}% ({{audit.totalAfter}})",
        evidence: "measured",
        stage: 4,
      },
      {
        metric: "New product to first usable screen",
        before: "{{outcomes.firstScreen.beforeWeeks}} weeks",
        after: "{{outcomes.firstScreen.afterDays}} days",
        evidence: "measured",
        stage: 3,
      },
      { metric: "Developer time saved per year", before: "—", after: "≈ {{outcomes.hoursSaved|en}} h", evidence: "estimated", stage: 5 },
    ],
  },
  lookingBack: [
    {
      lesson: "Governance was too heavy at first: we required an RFC for a new icon, and contributions dropped until we added a fast lane.",
      nextTime: "Next time I would start with a fast lane for small changes and add process only where a change can break something.",
    },
    {
      lesson: "Brand came in late: {{reflection.tokenRounds|word}} token rounds would have been one if the brand team had joined before the first release.",
      nextTime: "Next time I would bring the brand team into the first token round, before anything ships.",
    },
    {
      lesson: "We counted adoption by hand for {{outcomes.countedByHandMonths|word}} months and argued about the numbers.",
      nextTime: "Next time I would measure adoption automatically from the first release.",
    },
    {
      lesson: "Some inconsistencies sit in the back ends, where a design system can’t reach: date and number formats still differ.",
      nextTime: "Next time I would audit the data each product receives, not only its screens, before promising consistency.",
    },
  ],
  team: [
    { role: "Product designer", count: "{{team.designers}}", line: "Owned the tokens in Figma and the written decisions behind each component." },
    { role: "Component developers", count: "{{team.developers}}", line: "Built the components on Angular Material and ran the token pipeline." },
    { role: "Contributors from product teams", count: "{{team.contributors}}", line: "Proposed and built changes through RFCs and the fast lane, beside their own roadmaps." },
    { role: "Lead developers", count: "{{coalition.leadDevelopers}}", line: "Co-signed the proposal and opened their teams to the pilot." },
    { role: "Accessibility officer", count: "{{roles.accessibility}}", line: "Co-signed the proposal and checked every component against WCAG 2.1 AA." },
    { role: "Sponsor, Head of Digital Services", count: "{{roles.sponsor}}", line: "Took the proposal to the steering board and held the pilot to its one metric." },
  ],
  credits:
    "Credits (fictional): core team of {{team.designers|word}} designer and {{team.developers|word}} component developers; {{team.contributors}} contributors from product teams; the accessibility officer; sponsor — Head of Digital Services.",
  figures,
  images,
};

export const caseStudy: CaseStudy = { ...fillDeep(rawCaseStudy, data), assets: assets as Record<string, ImageAsset> };
