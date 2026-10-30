import type { CaseStudy, ImageAsset } from "@/lib/case-study";
import { fillDeep } from "@/lib/fill";
import { data } from "./data";
import { figures, images } from "./figures";
import assets from "./images.json";

/**
 * Seilschaft: a fictional model case study about building a UX practice (people leadership).
 * Same fictional employer as Test Project: Hochmatt Informatik, the IT provider of the Canton of
 * Hochmatt. Written with {{tokens}} into data.ts; nothing here may spell out a number of its own
 * (npm run check:figures).
 */
export const rawCaseStudy: CaseStudy = {
  example: true,
  banner: {
    label: "Model case study · Fictional example",
    text: "the organisation, people and figures are invented to show the format.",
  },
  lede: "How a {{team.start|word}}-person UX service desk became a {{team.end|word}}-person practice that product teams plan with.",
  typeLine: "People · Team building · UX Team Lead · {{project.years}} years · {{years.start}}–{{years.end}} (fictional)",
  metaDescription: "Fictional model case study: building a UX practice out of a ticket-queue service desk, in a UX leadership case study format.",
  summary: {
    mandate: "Management asked for “more UX capacity” after a designer resigned. I argued for a practice instead of headcount.",
    role: "UX Team Lead. I wrote the case, hired, set up the rituals and co-wrote the career ladder with HR.",
    teamLed:
      "{{team.start}} designers at the start, {{team.end}} at the end ({{team.designers}} designers, {{team.researchers}} researcher, {{team.uxEngineers}} UX engineer).",
    putInPlace: [
      "One intake with {{intake.tiers|word}} tiers",
      "Designers assigned to product clusters, not tickets",
      "Weekly crit",
      "A career ladder",
      "A participant pool of {{rituals.poolCitizens}} citizens",
    ],
    keyDecision: "Hub and spoke: one team with shared standards, each designer seated in a product cluster.",
    outcome: [
      { text: "Requests arriving before development starts {{requests.before}}% → {{requests.after}}%", evidence: "measured" },
      { text: "Product teams with a named designer {{named.before}} → {{named.after}} of {{org.productTeams}}", evidence: "measured" },
      { text: "Regretted attrition {{attrition.after}} in {{project.years|word}} years", evidence: "measured" },
    ],
    note: "Fictional example data.",
  },
  didNotDo: "I didn’t create a dedicated DesignOps role; the team rotated intake duty, which I would change at {{reflection.rotateAt|word}} people.",
  hero: "sl-hero",
  waypoints: [
    {
      id: "context",
      nav: "Context",
      label: "Context",
      finding: "a service desk with {{team.start|word}} chairs",
      blocks: [
        {
          kind: "p",
          text: "In {{years.start}}, {{team.start|word}} designers served {{org.productTeams}} product teams at Hochmatt Informatik, the IT provider of the fictional Canton of Hochmatt, through a ticket queue. Most requests arrived {{desk.lateWeeks|word}} weeks before a release, and {{desk.visualOnly.n|word}} in {{desk.visualOnly.of|word}} asked only for “a nicer screen”. Only {{requests.before}}% of work reached UX before development began, so research was rare and rework was common.",
        },
        {
          kind: "p",
          text: "The queue shaped everything else. Designers picked up the next ticket rather than the most important problem, nobody kept a view across the teams, and the same patterns were redrawn for permits, payments and internal tools. Product owners treated UX as a final check, much like a spell-checker: useful, late and easy to skip when a deadline moved.",
        },
        {
          kind: "list",
          intro: "What the desk looked like in {{years.start}}:",
          items: [
            "{{team.start|Word}} designers, {{org.productTeams}} product teams and one shared ticket queue.",
            "Requests arriving {{desk.lateWeeks|word}} weeks before release, most of them visual.",
            "No research budget, no shared standards and no career path beyond “senior”.",
          ],
        },
        {
          kind: "p",
          text: "When one designer resigned, citing “being a colouring-in service”, management offered a replacement hire. It was a reasonable offer. It would also have refilled the same chair at the same desk.",
        },
      ],
    },
    {
      id: "leadership",
      nav: "Leadership",
      label: "Leadership",
      finding: "I pitched a practice, not a headcount",
      blocks: [
        {
          kind: "p",
          text: "A replacement would have rebuilt the same queue. So I brought the steering board numbers from our own tickets: how many requests arrived late, {{desk.reworkHours}} hours of rework after release in a single year, and {{desk.neverMet}} teams that had never met a designer. None of it was new to the people in the room; seeing it on one page was.",
        },
        {
          kind: "p",
          text: "The ask was staged: {{ask.yearOneHires|word}} hires in year one, each tied to one milestone, and a review before any further growth. Staging made the budget a decision about evidence, not about trust.",
        },
        {
          kind: "list",
          intro: "The milestones were written so the board could check them without me:",
          items: [
            { lead: "Intake.", text: "Within {{ask.intakeMonths|word}} months, every request passes through one intake, so demand becomes visible." },
            { lead: "Named designers.", text: "The {{ask.firstTeams|word}} teams with the most citizen traffic each get a designer they can name." },
            { lead: "Review.", text: "At month {{ask.reviewMonths|word}}, the board decides whether the practice grows or stops where it is." },
          ],
        },
        { kind: "figure", id: "sl-steering-onepager" },
        {
          kind: "p",
          text: "I kept two conversations apart. With the steering board I argued in numbers; with the team I argued in work. Every Friday I sent the Head of Digital Services a half-page note: what came through the intake, what we said no to, and why. When the first review came, there was nothing to present that she hadn’t already read, and the second stage was approved in the meeting.",
        },
      ],
    },
    {
      id: "discovery",
      nav: "Discovery",
      label: "Discovery",
      finding: "teams didn’t want more designers, they wanted earlier ones",
      blocks: [
        {
          kind: "p",
          text: "I interviewed all {{interviews.productOwners}} product owners, {{interviews.minutes}} minutes each, with the same questions: when do you involve design, what do you expect back, and what stops you asking sooner? {{interviews.earlier|Word}} said they would involve UX earlier if they knew what they would get and when.",
        },
        {
          kind: "list",
          intro: "What held them back:",
          items: [
            { lead: "No slot in the plan.", text: "Teams planned a quarter ahead; UX had no place in that plan, so it arrived as a favour at the end." },
            { lead: "Scope fear.", text: "A late ticket felt safer than an early conversation that might change what the team had promised." },
            { lead: "No name.", text: "Nobody knew which designer would pick up their work, or when, so nobody built a relationship." },
          ],
        },
        { kind: "figure", id: "sl-interviews" },
        { kind: "insight", text: "Capacity was never the bottleneck. Predictability was." },
        {
          kind: "p",
          text: "The other {{interviews.notEarlier|word}} were honest about it: {{interviews.internalTools|word}} ran internal tools with few users and saw little to gain, and one simply wanted fewer meetings. We took that seriously. The intake had to be cheaper for teams than the queue, not just better for us.",
        },
        {
          kind: "p",
          text: "The problem was predictability, not appetite. So before hiring anyone, we built an intake that made our capacity visible: a public board where every team could see what we were working on, what came next, and what we had said no to.",
        },
      ],
    },
    {
      id: "decisions",
      nav: "Decisions",
      label: "Decisions",
      finding: "{{decisions.count|word}} calls that shaped the team",
      blocks: [
        {
          kind: "decision",
          id: "organisation",
          title: "How is the team organised?",
          text: [
            "We grouped the {{org.productTeams}} teams into {{org.clusters|word}} clusters by the people they serve: permits, payments, social services and internal tools.",
          ],
          options: {
            caption: "Three ways to organise the team",
            columns: ["Option", "Gain", "Cost"],
            rows: [
              { option: "Central service desk", pro: "Simple to manage", con: "Keeps the queue and the late requests" },
              { option: "Fully embedded in product teams", pro: "Close to the product", con: "Designers isolated, standards drift" },
              {
                option: "Hub and spoke",
                pro: "Product closeness plus shared crit and standards",
                con: "Needs a weekly rhythm to hold together",
                chosen: true,
              },
            ],
          },
          chose: "Hub and spoke: one team with shared standards, each designer seated in a product cluster.",
          cost: "It needs a weekly rhythm to hold together; without one, the spokes drift back into isolation.",
          mitigation: "A crit slot nothing else may book, and a yearly rotation between clusters, so standards travel with people.",
        },
        {
          kind: "decision",
          id: "hiring",
          title: "Whom do we hire first?",
          options: {
            caption: "Three hiring plans",
            columns: ["Option", "Gain", "Cost"],
            rows: [
              { option: "{{hiring.optionSize|Word}} seniors", pro: "Fast impact", con: "Budget for {{ask.yearOneHires|word}}, and no growth path to show" },
              { option: "{{hiring.optionSize|Word}} juniors", pro: "Affordable", con: "Mentoring load on {{team.start|word}} stretched people" },
              {
                option: "One senior, then {{hiring.juniors|word}} juniors",
                pro: "The senior co-mentors from month {{hiring.mentorMonth|word}}",
                con: "A slower first {{hiring.slowMonths|word}} months",
                chosen: true,
              },
            ],
          },
          chose: "One senior first, then juniors the senior could help bring on.",
          cost: "A slower first half-year, most of it spent waiting for the senior.",
          mitigation:
            "Work samples instead of take-home tasks: a paid {{hiring.workSampleHours|word}}-hour session on a real, anonymised request, scored by a panel of {{hiring.panel|word}} on {{hiring.criteria|word}} criteria.",
          after: "Candidates told us it was the first interview where they had worked with the team rather than performed for it.",
        },
        { kind: "figure", id: "sl-scorecard" },
        {
          kind: "decision",
          id: "visual-only",
          title: "What do we do with visual-only requests?",
          options: {
            caption: "Three answers to “just make it nicer”",
            columns: ["Option", "Gain", "Cost"],
            rows: [
              { option: "Refuse them", pro: "Protects focus", con: "Burns goodwill with the teams we wanted to win" },
              { option: "Accept all", pro: "Goodwill", con: "Back to the colouring-in service" },
              {
                option: "A “Polish” tier capped at {{intake.polishDays|word}} days, with templates",
                pro: "Teams get help fast, and the cap makes the trade-off visible",
                con: "Some teams game the cap at first",
                chosen: true,
              },
            ],
          },
          chose: "The Polish tier: {{intake.polishDays}} days at most, built from templates.",
          cost: "Some teams gamed the cap at first, splitting one redesign into several Polish tickets.",
          mitigation: "Intake duty merged related tickets and said so on the public board; after a quarter, the splitting stopped.",
        },
        { kind: "figure", id: "sl-intake-board" },
      ],
    },
    {
      id: "delivery",
      nav: "Delivery",
      label: "Delivery",
      finding: "rituals over rules",
      blocks: [
        {
          kind: "p",
          text: "The intake has {{intake.tiers|word}} tiers: Explore (research and concept), Shape (design with the team) and Polish ({{intake.polishDays|word}} days, templates). Each tier has an entry rule a product owner can check alone, so nobody needs a meeting to find out where a request belongs.",
        },
        {
          kind: "p",
          text: "A weekly {{rituals.critMinutes}}-minute crit keeps {{team.end|word}} people on one standard. Crit is for the work, never the person: written notes, one owner per follow-up, and the presenter decides what to take. A monthly research day draws on a pool of {{rituals.poolCitizens}} citizens who agreed to be contacted, which turned recruiting from weeks of e-mails into a calendar entry.",
        },
        { kind: "figure", id: "sl-rituals" },
        {
          kind: "p",
          text: "Every new hire walks a {{onboarding.first}}-{{onboarding.second}}-{{onboarding.third}} onboarding trail. Each stage ends with something shipped rather than something read: a Polish ticket, a Shape project with a mentor, then a first Explore study of their own. The senior I hired first walked it too, and rewrote half of it.",
        },
        { kind: "figure", id: "sl-onboarding" },
        {
          kind: "p",
          text: "The {{ladder.levels|word}}-level career ladder, with examples for each level, was co-written with HR so it counts in salary reviews and not only in the team. It describes behaviour, not titles: how far ahead someone plans, whom they bring in, what they leave behind. Both internal promotions went through it unchanged.",
        },
        { kind: "figure", id: "sl-ladder" },
        {
          kind: "p",
          text: "The {{team.end|ordinal}} seat came from inside. A front-end developer who had sat in on every crit for a year moved across as our UX engineer, and prototypes in code became part of Shape rather than a special request.",
        },
      ],
    },
    {
      id: "outcome",
      nav: "Outcome",
      label: "Outcome & reflection",
      finding: "the queue became a roadmap seat",
      blocks: [
        {
          kind: "metrics",
          label: "Outcomes at a glance",
          items: [
            { value: "{{requests.after}}%", label: "of requests reach UX before development", detail: "from {{requests.before}}%", evidence: "measured" },
            {
              value: "{{named.after}} of {{org.productTeams}}",
              label: "product teams with a named designer",
              detail: "from {{named.before}} of {{org.productTeams}}",
              evidence: "measured",
            },
            {
              value: "{{team.start}} → {{team.end}}",
              label: "people in the practice",
              detail: "{{team.hires}} hires, {{team.internalMoves|word}} internal move",
              evidence: "measured",
            },
          ],
        },
        {
          kind: "outcomes",
          caption: "Outcomes — fictional example data",
          legend: {
            measured: "intake board and HR records, {{years.start}}–{{years.end}}",
            estimated: "quarterly team pulse, n = {{team.end}}",
          },
          rows: [
            { metric: "Requests before development starts", before: "{{requests.before}}%", after: "{{requests.after}}%", evidence: "measured" },
            {
              metric: "Product teams with a named designer",
              before: "{{named.before}} of {{org.productTeams}}",
              after: "{{named.after}} of {{org.productTeams}}",
              evidence: "measured",
            },
            { metric: "Team size", before: "{{team.start}}", after: "{{team.end}}", evidence: "measured" },
            {
              metric: "Regretted attrition",
              before: "{{attrition.before}} in {{years.start}}",
              after: "{{attrition.after}} in {{project.years}} years",
              evidence: "measured",
            },
            {
              metric: "Team engagement score",
              before: "{{engagement.before|signed}}",
              after: "{{engagement.after|signed}}",
              evidence: "estimated",
              note: "a pulse of {{team.end|word}} people — directional",
            },
          ],
        },
        { kind: "figure", id: "sl-requests-chart" },
        { kind: "figure", id: "sl-designers-chart" },
        {
          kind: "p",
          lead: "What did not improve:",
          text: "the internal-tools cluster still sends late requests. It plans by firefighting, and an intake can’t fix that on its own.",
        },
        {
          kind: "list",
          intro: "Reflection:",
          items: [
            {
              lead: "I hired too slowly in year one.",
              text: "I waited {{hiring.seniorWaitMonths|word}} months for a perfect senior; a good one would have saved a quarter.",
            },
            { lead: "The ladder needed HR from day one.", text: "My first draft lived only in our wiki and counted for nothing in reviews." },
            { lead: "Tiers need a public “why”.", text: "Teams accepted the Polish cap once we published the reasoning beside it." },
          ],
        },
      ],
    },
  ],
  credits:
    "Credits (fictional): sponsor — Head of Digital Services; HR partner for the career ladder; {{team.designers|word}} designers, {{team.researchers|word}} researcher and {{team.uxEngineers|word}} UX engineer.",
  figures,
  images,
};

export const caseStudy: CaseStudy = { ...fillDeep(rawCaseStudy, data), assets: assets as Record<string, ImageAsset> };
