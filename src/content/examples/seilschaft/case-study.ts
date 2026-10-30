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
  lede: "How a {{team.start|word}}-person UX service desk became a {{team.end|word}}-person practice that product teams plan with.",
  typeLine: "People · Team building · UX Team Lead · {{project.years}} years · {{years.start}}–{{years.end}} (fictional)",
  metaDescription: "Fictional model case study: building a UX practice out of a ticket-queue service desk, in a UX leadership case study format.",
  problem:
    "{{team.start|Word}} designers served {{org.productTeams}} product teams through a ticket queue, and most requests arrived {{desk.lateWeeks|word}} weeks before release. Only {{requests.before}}% of work reached UX before development began, so research was rare and rework was common. When a designer resigned, management offered a replacement hire for the same queue.",
  impactLine: "{{requests.after}}% of requests now reach UX before development starts, up from {{requests.before}}%.",
  facts: {
    role: "UX Team Lead",
    team: "{{team.start}} → {{team.end}} people",
    time: "{{project.years|word}} years, {{years.start}}–{{years.end}}",
  },
  summary: {
    brief: "Management asked for more UX capacity after a designer resigned. I argued for a practice instead of headcount.",
    outcome: [
      { text: "Requests arriving before development starts {{requests.before}}% → {{requests.after}}%", evidence: "measured" },
      { text: "Product teams with a named designer {{named.before}} → {{named.after}} of {{org.productTeams}}", evidence: "measured" },
      { text: "Regretted attrition {{attrition.after}} in {{project.years|word}} years", evidence: "measured" },
    ],
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
    note: "Fictional example data.",
  },
  didNotDo: "I didn’t create a dedicated DesignOps role; the team rotated intake duty, which I would change at {{reflection.rotateAt|word}} people.",
  hero: "sl-hero",
  stages: [
    {
      id: "context",
      nav: "Context",
      finding: "{{team.start|Word}} designers worked through a ticket queue that product teams reached too late.",
      blocks: [
        {
          kind: "p",
          text: "In {{years.start}}, {{team.start|word}} designers served {{org.productTeams}} product teams at Hochmatt Informatik, the IT provider of the fictional Canton of Hochmatt, through a ticket queue. Most requests arrived {{desk.lateWeeks|word}} weeks before a release, and {{desk.visualOnly.n|word}} in {{desk.visualOnly.of|word}} asked only for a nicer screen. Only {{requests.before}}% of work reached UX before development began, so research was rare and rework was common.",
        },
        {
          kind: "p",
          text: "The queue shaped everything else. Designers picked up the next ticket rather than the most important problem, nobody kept a view across the teams, and the same patterns were redrawn for permits, payments and internal tools. Product owners treated UX as a final check, much like a spell-checker: useful, late and easy to skip when a deadline moved.",
          note: "Rework after release was the clearest cost, and it showed up in our own ticket history.",
        },
        {
          kind: "list",
          intro: "What the desk looked like in {{years.start}}:",
          items: [
            "{{team.start|Word}} designers, {{org.productTeams}} product teams and one shared ticket queue.",
            "Requests arriving {{desk.lateWeeks|word}} weeks before release, most of them visual.",
            "No research budget, no shared standards and no career path beyond senior designer.",
          ],
        },
        {
          kind: "p",
          text: "When one designer resigned, tired of being asked only to colour in screens, management offered a replacement hire. It was a reasonable offer. It would also have refilled the same seat at the same desk.",
        },
      ],
    },
    {
      id: "leadership",
      nav: "Leadership",
      finding: "I asked the board for a practice instead of a replacement hire, in stages it could check.",
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
          note: "The note always had the same headings: what came in, what we declined, and why.",
        },
      ],
    },
    {
      id: "discovery",
      nav: "Discovery",
      finding: "Product teams did not want more designers; they wanted design they could plan for.",
      blocks: [
        {
          kind: "p",
          text: "I interviewed all {{interviews.productOwners}} product owners, {{interviews.minutes}} minutes each, with the same questions: when do you involve design, what do you expect back, and what stops you asking sooner? {{interviews.earlier|Word}} said they would involve UX earlier if they knew what they would get and when.",
          note: "Same questions in the same order every time, so answers could be compared across clusters.",
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
          text: "So before hiring anyone, we built an intake that made our capacity visible: a public board where every team could see what we were working on, what came next, and what we had said no to.",
        },
      ],
    },
    {
      id: "decisions",
      nav: "Decisions",
      finding: "{{decisions.count|Word}} decisions set how the team works: where designers sit, whom we hire first and how far a quick fix may go.",
      blocks: [
        {
          kind: "decision",
          id: "organisation",
          title: "How is the team organised?",
          text: [
            "We grouped the {{org.productTeams}} teams into {{org.clusters|word}} clusters by the people they serve: permits, payments, social services and internal tools.",
          ],
          options: [
            {
              label: "Central service desk",
              pros: ["Simple to manage"],
              cons: ["Keeps the queue and the late requests"],
              cost: "{{desk.reworkHours}} hours of rework a year",
              status: "rejected",
            },
            {
              label: "Fully embedded in product teams",
              pros: ["Close to the product"],
              cons: ["Designers work alone", "Standards drift apart"],
              cost: "Shared standards",
              status: "rejected",
            },
            {
              label: "Hub and spoke",
              pros: ["Close to the product", "Shared crit and standards"],
              cons: ["Without a weekly rhythm, designers drift back into isolation"],
              cost: "A weekly rhythm to hold it together",
              status: "chosen",
            },
          ],
          after: "We carried the cost with a crit slot nothing else may book, and a yearly rotation between clusters, so standards travel with people.",
        },
        {
          kind: "decision",
          id: "hiring",
          title: "Whom do we hire first?",
          options: [
            {
              label: "{{hiring.optionSize|Word}} seniors",
              pros: ["Fast impact"],
              cons: ["No growth path to show"],
              cost: "Budget for {{hiring.optionSize|word}}, not {{ask.yearOneHires|word}}",
              status: "rejected",
            },
            {
              label: "{{hiring.optionSize|Word}} juniors",
              pros: ["Affordable"],
              cons: ["Mentoring load on {{team.start|word}} stretched people"],
              cost: "Mentoring time we didn’t have",
              status: "rejected",
            },
            {
              label: "One senior, then {{hiring.juniors|word}} juniors",
              pros: ["The senior co-mentors from month {{hiring.mentorMonth|word}}"],
              cons: ["The juniors wait for the senior to start"],
              cost: "A slower first {{hiring.slowMonths|word}} months",
              status: "chosen",
            },
          ],
          after:
            "We carried the cost by hiring with work samples instead of take-home tasks: a paid {{hiring.workSampleHours|word}}-hour session on a real, anonymised request, scored by a panel of {{hiring.panel|word}} on {{hiring.criteria|word}} criteria.",
        },
        { kind: "figure", id: "sl-scorecard" },
        {
          kind: "decision",
          id: "visual-only",
          title: "What do we do with visual-only requests?",
          options: [
            {
              label: "Refuse them",
              pros: ["Protects focus"],
              cons: ["Burns goodwill with the teams we wanted to win"],
              cost: "Goodwill with the teams",
              status: "rejected",
            },
            {
              label: "Accept all",
              pros: ["Goodwill"],
              cons: ["Back to colouring in screens"],
              cost: "The time for early work",
              status: "rejected",
            },
            {
              label: "A Polish tier: {{intake.polishDays}} days at most, from templates",
              pros: ["Teams get help fast", "The cap makes the trade-off visible"],
              cons: ["Some teams game the cap at first"],
              cost: "A quarter of split tickets",
              status: "chosen",
            },
          ],
          after:
            "We carried the cost at intake: when teams split one redesign into several Polish tickets, intake duty merged them and said so on the public board; after a quarter, the splitting stopped.",
        },
        { kind: "figure", id: "sl-intake-board" },
      ],
    },
    {
      id: "delivery",
      nav: "Delivery",
      finding: "Shared rituals, not written rules, kept a growing team on one standard.",
      blocks: [
        {
          kind: "p",
          text: "The intake has {{intake.tiers|word}} tiers: Explore (research and concept), Shape (design with the team) and Polish ({{intake.polishDays|word}} days, templates). Each tier has an entry rule a product owner can check alone, so nobody needs a meeting to find out where a request belongs.",
        },
        {
          kind: "p",
          text: "A weekly crit of {{rituals.critMinutes}} minutes keeps {{team.end|word}} people on one standard. Crit is for the work, never the person: written notes, one owner per follow-up, and the presenter decides what to take. A monthly research day draws on a pool of {{rituals.poolCitizens}} citizens who agreed to be contacted, which turned recruiting from weeks of e-mails into a calendar entry.",
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
          note: "The first version was written without HR and had to be withdrawn; see the decision we reversed.",
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
      finding: "Design moved into the teams’ planning: most requests now reach UX before development starts.",
      blocks: [
        {
          kind: "p",
          text: "The intake made demand visible in the first year; seating designers in clusters moved it earlier in the years after. By {{years.end}}, {{named.after}} of {{org.productTeams}} product teams could name their designer, up from {{named.before}}.",
        },
        { kind: "figure", id: "sl-requests-chart" },
        { kind: "figure", id: "sl-designers-chart" },
        {
          kind: "p",
          text: "The practice grew from {{team.start}} to {{team.end}} people with {{team.hires}} hires and {{team.internalMoves|word}} internal move, and nobody we wanted to keep has left.",
        },
        {
          kind: "p",
          lead: "What did not improve:",
          text: "the internal-tools cluster still sends late requests. It plans by firefighting, and an intake can’t fix that on its own.",
        },
      ],
    },
  ],
  reversedDecision: {
    kind: "decision",
    id: "ladder",
    title: "Who writes the career ladder?",
    text: ["Designers had no path beyond senior designer. The team needed a ladder; the question was whose document it would be."],
    options: [
      {
        label: "The team writes it alone and publishes it in our wiki",
        pros: ["Quick to write", "Written by the people it describes"],
        cons: ["No standing with HR", "Counts for nothing in salary reviews"],
        cost: "{{reversal.lostMonths|Word}} months and a stalled promotion",
        status: "reversed",
        turnedBack: {
          date: "{{reversal.turnedBack}}",
          text: "Published in {{reversal.wikiPublished}}, the wiki ladder had no standing with HR: the first promotion case built on it stalled in the salary review, so we withdrew it and started again with HR.",
        },
      },
      {
        label: "Rebuild it with HR, inside the salary framework",
        pros: ["Counts in salary reviews", "HR can defend it outside the team"],
        cons: ["HR’s review cycle sets the pace"],
        cost: "+{{reversal.hrMonths}} months",
        status: "chosen",
      },
      {
        label: "Wait for a company-wide framework from HR",
        pros: ["No extra work for the team"],
        cons: ["No date for it", "Designers stay without a path meanwhile"],
        cost: "Another year without a path",
        status: "rejected",
      },
    ],
    after: "The ladder rebuilt with HR was published in {{reversal.hrPublished}}, and both internal promotions went through it unchanged.",
  },
  afterLaunch: {
    caption: "After the practice was set up: dated observations from the intake board, support desk and research days (fictional)",
    entries: [
      {
        date: "{{log.review.date}}",
        text: "Intake board at the yearly review: {{requests.after}}% of requests reached UX before development started. The internal-tools cluster still sent most of its requests in the last {{desk.lateWeeks|word}} weeks before release.",
      },
      {
        date: "{{log.permitTest.date}}",
        text: "Research day, permits cluster: {{log.permitTest.after}} of {{log.permitTest.n}} citizens from the pool completed a building-permit application unaided, against {{log.permitTest.before}} of {{log.permitTest.n}} on the old form.",
      },
      {
        date: "{{log.payments.date}}",
        text: "Payments cluster: support tickets about failed invoice payments fell from {{log.payments.before}} to {{log.payments.after}} per month once the cluster’s first Shape project had shipped.",
      },
      {
        date: "{{log.splitFixed.date}}",
        text: "Intake log: merged Polish tickets fell from {{log.split.merged}} to {{log.splitFixed.merged}} in the quarter after we published the reason for the cap beside it.",
      },
      {
        date: "{{log.split.date}}",
        text: "Intake log: {{log.split.merged}} Polish tickets in one quarter turned out to be parts of {{log.split.redesigns|word}} redesigns; intake duty merged them on the public board.",
      },
      {
        date: "{{log.adoption.date}}",
        text: "Adoption: all {{org.productTeams}} product teams had sent at least one request through the intake, {{log.adoption.months|word}} months after it opened.",
      },
    ],
  },
  results: {
    caption: "Results — fictional example data",
    legend: {
      measured: "intake board and HR records, {{years.start}}–{{years.end}}",
      estimated: "quarterly team pulse, n = {{team.end}}, directional",
    },
    rows: [
      { metric: "Requests reaching UX before development starts", before: "{{requests.before}}%", after: "{{requests.after}}%", evidence: "measured", stage: 3 },
      {
        metric: "Product teams with a named designer",
        before: "{{named.before}} of {{org.productTeams}}",
        after: "{{named.after}} of {{org.productTeams}}",
        evidence: "measured",
        stage: 4,
      },
      {
        metric: "People in the practice",
        before: "{{team.start}}",
        after: "{{team.end}} ({{team.hires}} hires, {{team.internalMoves|word}} internal move)",
        evidence: "measured",
        stage: 2,
      },
      {
        metric: "Regretted attrition",
        before: "{{attrition.before}} in {{years.start}}",
        after: "{{attrition.after}} in {{project.years}} years",
        evidence: "measured",
        stage: 5,
      },
      { metric: "Team engagement score", before: "{{engagement.before|signed}}", after: "{{engagement.after|signed}}", evidence: "estimated", stage: 5 },
    ],
  },
  lookingBack: [
    {
      lesson: "I hired too slowly in year one: I waited {{hiring.seniorWaitMonths|word}} months for a perfect senior, and a good one would have saved a quarter.",
      nextTime: "Next time I would set a hiring deadline and take the best good candidate when it passes.",
    },
    {
      lesson: "The ladder needed HR from day one. My first draft lived only in our wiki and counted for nothing in reviews.",
      nextTime: "Next time I would bring HR in before the first draft and write the ladder in their review format.",
    },
    {
      lesson: "Tiers need a public reason. Teams accepted the Polish cap once we published the reasoning beside it.",
      nextTime: "Next time I would publish the reason for every intake rule on the day the rule starts.",
    },
    {
      lesson: "An intake can’t fix a team that plans by firefighting; the internal-tools cluster still sends late requests.",
      nextTime: "Next time I would work on that cluster’s planning with its product owners, not only on our intake.",
    },
  ],
  team: [
    { role: "Designers", count: "{{team.designers}}", line: "Each seated in a product cluster; the senior hired first co-mentored the juniors." },
    { role: "Researcher", count: "{{team.researchers}}", line: "Ran the monthly research day and kept the participant pool." },
    { role: "UX engineer", count: "{{team.uxEngineers}}", line: "Moved across from front-end development and made prototypes in code part of Shape." },
    { role: "HR partner", count: "{{partners.hr}}", line: "Rebuilt the career ladder with us so it counts in salary reviews." },
    { role: "Product owners", count: "{{interviews.productOwners}}", line: "Brought their requests through the intake and planned design into their quarters." },
    { role: "Sponsor, Head of Digital Services", count: "{{partners.sponsor}}", line: "Took the staged ask to the steering board and read the weekly note." },
  ],
  credits:
    "Credits (fictional): sponsor — Head of Digital Services; HR partner for the career ladder; {{team.designers|word}} designers, {{team.researchers|word}} researcher and {{team.uxEngineers|word}} UX engineer.",
  figures,
  images,
};

export const caseStudy: CaseStudy = { ...fillDeep(rawCaseStudy, data), assets: assets as Record<string, ImageAsset> };
