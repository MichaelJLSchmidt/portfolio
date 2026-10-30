import type { CaseStudy, ImageAsset } from "@/lib/case-study";
import { fillDeep } from "@/lib/fill";
import { data } from "./data";
import { figures, images } from "./figures";
import assets from "./images.json";

/**
 * Test Project: a fictional model case study that shows every building block of the template.
 * Written with {{tokens}} into data.ts; nothing here may spell out a number of its own
 * (npm run check:figures).
 */
export const rawCaseStudy: CaseStudy = {
  example: true,
  lede: "A bilingual subsidy service where {{outcomes.complete.after}}% of applications are now complete on first submission.",
  typeLine: "Service design · Public sector · UX Team Lead · {{project.months}} months · {{years.start}}–{{years.end}} (fictional)",
  metaDescription: "Fictional model case study demonstrating a senior UX case study format.",
  problem:
    "Homeowners in the fictional Canton of Hochmatt applied for a heating subsidy on a {{pdf.pages}}-page PDF that asked for technical data only their installer had. {{problem.incompletePct}}% of applications arrived incomplete, and caseworkers spent about a third of their time chasing documents. Homeowners waited a median {{problem.medianDays}} days for a decision.",
  impactLine: "{{outcomes.complete.after}}% of applications are now complete on first submission, up from {{outcomes.complete.before}}%.",
  facts: {
    role: "UX Team Lead",
    team: "{{team.designersLed}} designers · {{team.productDev}} product & dev",
    time: "{{project.months}} months · {{years.start}}–{{years.end}}",
  },
  summary: {
    brief:
      "The Energy Office asked for the PDF, put online, in {{mandate.months}} months. I reframed the goal as complete on first submission, because a faster PDF would still arrive incomplete.",
    outcome: [
      { text: "Incomplete submissions {{outcomes.incomplete.before}}% → {{outcomes.incomplete.after}}%", evidence: "measured" },
      { text: "Median time to decision {{outcomes.medianDays.before}} → {{outcomes.medianDays.after}} days", evidence: "measured" },
      { text: "Caseworker calls ≈ {{outcomes.callsPct}}%", evidence: "estimated" },
    ],
    role: "UX Team Lead. I set research and design strategy, facilitated {{workshops.count}} cross-unit workshops and built the core form patterns in Angular.",
    teamLed:
      "{{team.designersLed}} designers directly, inside a squad of {{team.productDev}} product and development colleagues, plus a francophone content designer.",
    putInPlace: [
      "One north-star metric for {{workshops.units|word}} units",
      "A weekly decision log signed off by legal",
      "German and French written side by side, not translated",
      "Caseworker testing every {{delivery.caseworkerTestingWeeks|word}} weeks",
    ],
    keyDecision:
      "Let installers prepare the application and homeowners confirm it via AGOV, instead of forcing homeowners through a {{pdf.pages}}-page form alone.",
    note: "Fictional example data.",
  },
  didNotDo: "I didn’t design the caseworker back office. I lobbied for its budget and handed my research to the vendor’s team.",
  hero: "tp-hero",
  stages: [
    {
      id: "context",
      nav: "Context",
      finding: "A {{pdf.pages}}-page PDF and a shared inbox left {{problem.incompletePct}}% of applications incomplete.",
      blocks: [
        {
          kind: "p",
          text: "The fictional Canton of Hochmatt pays homeowners up to CHF {{subsidy.maxChf|en}} to replace an oil or gas heating with a heat pump or district heating. Demand tripled after {{years.demandRise}}, but the process was still a {{pdf.pages}}-page PDF, a shared e-mail inbox and a case-management system from {{years.caseSystem}}. {{problem.incompletePct}}% of applications arrived incomplete. {{problem.caseworkers|Word}} caseworkers spent about a third of their time chasing documents, and homeowners waited a median {{problem.medianDays}} days for a decision.",
          note: "Hochmatt, its Energy Office and every figure on this page are invented to show the format.",
        },
        {
          kind: "list",
          intro: "{{landscape.constraints|Word}} constraints shaped every decision:",
          items: [
            { lead: "Law —", text: "the subsidy ordinance requires the property owner’s own declaration. An installer cannot apply alone." },
            { lead: "Accessibility —", text: "WCAG 2.1 AA following eCH-0059, verified by an external audit before go-live." },
            { lead: "Languages —", text: "German and French are equal originals, not translations." },
            { lead: "Identity —", text: "login through AGOV, the Swiss authorities’ authentication service." },
            {
              lead: "Legacy —",
              text: "the case system only accepts a nightly batch import. A real-time API was {{api.monthsAway}} months away.",
            },
            {
              lead: "Procurement —",
              text: "the case-system vendor contract could not be reopened within the project, so the front end was built in-house in Angular.",
            },
          ],
        },
        { kind: "figure", id: "tp-landscape" },
      ],
    },
    {
      id: "leadership",
      nav: "Leadership",
      finding: "{{workshops.units|Word}} units agreed to judge every decision by one shared number.",
      blocks: [
        {
          kind: "p",
          text: "I led a UX team of {{team.ux|word}} ({{team.uxFte}} FTE on this project) and acted as design counterpart to the product owner from the Energy Office.",
        },
        {
          kind: "list",
          items: [
            {
              lead: "Reframed the brief.",
              text: "With the steering group, I replaced digitising the PDF with complete on first submission. It became the project’s north-star metric and the yardstick for every later trade-off.",
            },
            {
              lead: "Facilitated {{workshops.count|word}} workshops with {{workshops.participants}} participants from {{workshops.units|word}} units:",
              text: "kick-off and stakeholder map; service blueprint with caseworkers; decision workshop on the application model; design studio with developers; go-live retrospective. Hyper Island formats (check-ins, 1-2-4-All, explicit decision rules) gave legal and IT the same airtime as the most senior voice in the room.",
            },
            {
              lead: "Set the team rhythm.",
              text: "Weekly design critique, research share-outs at every sprint review, and a decision log written so the legal service could read it.",
            },
            {
              lead: "Grew people.",
              text: "I coached a mid-level designer to own the installer journey end to end. She presented it to the steering group in month {{project.coachingMonth}}.",
            },
            {
              lead: "Stayed hands-on.",
              text: "I built the stepper and validation patterns in Angular so the design system remained the single source of truth.",
            },
          ],
        },
        { kind: "figure", id: "tp-workshop-board" },
        {
          kind: "p",
          lead: "What I put in place:",
          text: "{{workshops.units|Word}} units each measured success differently: the Energy Office counted applications, finance counted payouts, legal counted complaints, IT counted uptime. In the first workshop we agreed on one shared number, applications complete on first submission, and every later decision was checked against it. A one-page decision log, reviewed every Thursday with the legal adviser, meant nobody re-opened a settled question. My designers each owned one journey end to end; I owned the cross-unit agreements and stayed out of their pixels.",
          note: "Each log entry named the question, the options, the decision, who signed it and the date.",
        },
      ],
    },
    {
      id: "discovery",
      nav: "Discovery",
      finding: "Installers, not homeowners, held most of the data the form asked for.",
      blocks: [
        {
          kind: "list",
          intro: "Methods and sample:",
          items: [
            "{{discovery.interviews}} contextual interviews: {{discovery.homeowners}} homeowners, {{discovery.installers}} heating installers, {{discovery.caseworkers}} caseworkers. {{discovery.inFrench}} were held in French.",
            "{{discovery.shadowDays}} days shadowing caseworkers, with {{discovery.callsLogged}} phone calls logged.",
            "{{discovery.filesAnalysed}} returned or rejected files from {{years.returnsSample}} analysed.",
            "Survey of past applicants: n = {{discovery.surveyN}} ({{discovery.surveyResponsePct}}% response rate).",
          ],
        },
        { kind: "figure", id: "tp-affinity" },
        {
          kind: "list",
          ordered: true,
          intro: "{{discovery.insights|Word}} insights changed the brief:",
          items: [
            {
              lead: "Installers, not homeowners, filled in most forms.",
              text: "{{discovery.installerFilledPct}}% of files showed the installer’s handwriting or e-mail address. Homeowners rarely knew the heat-pump model or the heated floor area.",
            },
            {
              lead: "Incomplete mostly meant {{discovery.documents|word}} documents.",
              text: "The quote, the building’s energy certificate number and proof of ownership caused {{discovery.threeDocumentsPct}}% of all returns.",
            },
            {
              lead: "Caseworkers rebuilt every case by hand.",
              text: "The nightly batch import was not the bottleneck. The missing structure in the incoming data was.",
            },
          ],
        },
        { kind: "insight", text: "The form was asking the wrong person for the right information." },
        {
          kind: "p",
          text: "Together with caseworkers, we mapped the current service as a blueprint. It exposed {{discovery.handoffs}} hand-offs and {{discovery.gaps}} moments where applicants received no feedback at all.",
          note: "Caseworkers drew the blueprint with us, and their sticky notes, not ours, named the gaps.",
        },
        {
          kind: "p",
          text: "{{discovery.archetypes|Word}} archetypes replaced the single applicant in every later discussion: the Delegating Owner, the Busy Installer and the Careful Caseworker.",
        },
        { kind: "figure", id: "tp-archetypes" },
        { kind: "figure", id: "tp-blueprint-current" },
      ],
    },
    {
      id: "decisions",
      nav: "Decisions",
      finding: "We designed the hand-off from installer to owner, not the form.",
      blocks: [
        {
          kind: "decision",
          id: "who-applies",
          title: "Who applies?",
          options: [
            {
              label: "Homeowner-only digital form",
              pros: ["Lowest legal risk"],
              cons: ["Repeats today’s failure: owners lack the technical data"],
              cost: "No gain on completeness",
              status: "rejected",
            },
            {
              label: "Installer applies alone",
              pros: ["Fastest, and the data is accurate"],
              cons: ["Not allowed: the ordinance requires the owner’s declaration"],
              cost: "A change to the ordinance",
              status: "rejected",
            },
            {
              label: "Delegated: installer prepares, homeowner reviews and confirms via AGOV",
              pros: ["Right data from the right person", "Legally sound"],
              cons: ["Two people, two logins", "A new waiting state"],
              cost: "{{decisions.stalledPct}}% of drafts stalled in beta",
              status: "chosen",
            },
          ],
          after:
            "We carried the cost with a share link, {{decisions.reminders|word}} reminder e-mails and a paper confirmation form as a fallback. Legal approved the delegated model in the {{workshops.legalApproved|ordinal}} workshop once the decision log showed that the owner’s declaration stayed intact.",
        },
        { kind: "figure", id: "tp-decision-matrix" },
        {
          kind: "decision",
          id: "pre-check",
          title: "Check eligibility before login?",
          text: [
            "Putting everything behind AGOV was simpler to build. A {{decisions.precheckQuestions|word}}-question anonymous pre-check tells about {{decisions.notEligible.one}} in {{decisions.notEligible.in}} visitors they are not eligible before they create an account.",
          ],
          options: [
            {
              label: "Everything behind the AGOV login",
              pros: ["Simpler to build", "One place for the rules"],
              cons: ["Ineligible visitors create an account first"],
              cost: "A wasted sign-up for {{decisions.notEligible.one}} in {{decisions.notEligible.in}}",
              status: "rejected",
            },
            {
              label: "Anonymous pre-check, then login",
              pros: ["Ineligible visitors learn it without an account"],
              cons: ["One more step before the form"],
              cost: "The eligibility rules exist in two places",
              status: "chosen",
            },
          ],
          after: "We carried the cost with a single, versioned rules file that legal reviews whenever the ordinance changes.",
        },
        {
          kind: "decision",
          id: "build-or-buy",
          title: "Buy a form builder or extend our design system?",
          text: [
            "The vendor’s form builder promised a demo in {{decisions.vendorDemoWeeks|word}} weeks, but an accessibility pre-check found {{decisions.vendorIssues}} issues. Extending Angular Material with cantonal design tokens meant {{decisions.firstDemoWeeks|word}} weeks before the first demo.",
          ],
          options: [
            {
              label: "The vendor’s form builder",
              pros: ["A demo in {{decisions.vendorDemoWeeks|word}} weeks"],
              cons: ["{{decisions.vendorIssues}} accessibility issues before the audit", "Components we could not change"],
              cost: "{{decisions.vendorIssues}} accessibility fixes",
              status: "rejected",
            },
            {
              label: "Extend Angular Material with cantonal tokens",
              pros: ["Accessible components we control", "Reusable by other services"],
              cons: ["{{decisions.firstDemoWeeks|Word}} weeks to the first demo"],
              cost: "A slower start and a nervous steering group",
              status: "chosen",
            },
          ],
          after:
            "We carried the cost by making the case with the audit findings and the reuse potential. The {{decisions.components}} resulting components are now used by {{decisions.reuseServices|word}} other services.",
        },
        {
          kind: "p",
          lead: "Deliberately not built:",
          text: "a live status tracker. With a nightly batch, any live status would have been fiction. The status page says what is true: “Received — review starts within {{decisions.statusWorkingDays}} working days.”",
        },
      ],
    },
    {
      id: "delivery",
      nav: "Design & delivery",
      finding: "Testing real code in German and French took task success from {{delivery.success.r1}} of {{delivery.perRound}} to {{delivery.success.r3}} of {{delivery.perRound}}.",
      blocks: [
        {
          kind: "p",
          text: "We moved from paper sketches in the design studio to mid-fidelity flows by week {{delivery.midFidelityWeek}} and a coded Angular prototype by week {{delivery.prototypeWeek}}. From then on, tests ran on real components, including with screen readers.",
        },
        { kind: "figure", id: "tp-flow" },
        { kind: "figure", id: "tp-sketch-to-wire" },
        {
          kind: "p",
          lead: "Usability testing:",
          text: "{{delivery.rounds|word}} moderated rounds of {{delivery.perRound}} participants each ({{delivery.participants}} in total; {{delivery.inFrench}} in French; {{delivery.assistiveTech}} using screen readers or magnification). Task success for submitting a complete application rose from {{delivery.success.r1}}/{{delivery.perRound}} to {{delivery.success.r2}}/{{delivery.perRound}} to {{delivery.success.r3}}/{{delivery.perRound}}.",
        },
        {
          kind: "p",
          lead: "Content:",
          text: "plain-language German and French written in parallel, not translated afterwards. Legal terms moved into expandable “Why we ask” hints.",
          note: "Writing both languages at once caught legal terms that had no plain equivalent in either.",
        },
        { kind: "figure", id: "tp-compare" },
        {
          kind: "p",
          lead: "Document upload:",
          text: "names the exact document required and shows an example. This targeted the {{discovery.documents|word}} items behind {{discovery.threeDocumentsPct}}% of returns.",
        },
        { kind: "figure", id: "tp-annotated-upload" },
        {
          kind: "p",
          lead: "Accessibility:",
          text: "the external WCAG 2.1 AA audit found {{delivery.auditIssues}} issues, none critical, all fixed before launch.",
        },
        { kind: "figure", id: "tp-design-system" },
        {
          kind: "p",
          lead: "Delivery:",
          text: "an {{delivery.betaWeeks}}-week beta with {{delivery.betaFirms|word}} installer firms, then a staged rollout. Design QA was part of the team’s Definition of Done.",
        },
        { kind: "figure", id: "tp-test-rounds" },
      ],
    },
    {
      id: "outcome",
      nav: "Outcome",
      finding: "Decisions now take {{outcomes.medianDays.after}} days instead of {{outcomes.medianDays.before}}, but some owners still stall at confirmation.",
      blocks: [
        {
          kind: "p",
          text: "In the first {{outcomes.months|word}} months after launch, {{outcomes.applications}} applications came through the new service. {{outcomes.complete.after}}% were complete on first submission, up from {{outcomes.complete.before}}%, and the median time to a decision fell from {{outcomes.medianDays.before}} to {{outcomes.medianDays.after}} days.",
        },
        { kind: "figure", id: "tp-outcomes" },
        {
          kind: "p",
          lead: "What did not improve:",
          text: "{{decisions.stalledPct}}% of delegated drafts still stalled at homeowner confirmation in those {{outcomes.months|word}} months. What we changed after launch is logged below.",
        },
      ],
    },
  ],
  reversedDecision: {
    kind: "decision",
    id: "owner-review",
    title: "How should the owner confirm?",
    text: [
      "At launch, legal wanted proof that the owner had seen every item the installer prepared, so the owner ticked off each of the {{product.steps|word}} sections before the declaration.",
    ],
    options: [
      {
        label: "Section-by-section review, then the declaration",
        pros: ["Shows legal the owner saw every item"],
        cons: ["Owners stop at technical sections they cannot judge", "Long on a phone"],
        cost: "{{product.steps|Word}} screens before confirming",
        status: "reversed",
        turnedBack: {
          date: "{{log.reversed}}",
          text: "Funnel analytics showed that {{afterLaunch.stallAtReviewPct}}% of stalled drafts stopped on this review, most on the heat-pump details. Legal agreed that one declaration over a full summary keeps the owner’s declaration intact.",
        },
      },
      {
        label: "One summary page and a single declaration",
        pros: ["Owners confirm what they know", "Installer entries stay marked as prepared by the installer"],
        cons: ["Owners can skim the technical data"],
        cost: "One more legal review",
        status: "chosen",
      },
      {
        label: "A caseworker calls the owner to confirm",
        pros: ["Personal help for stuck owners"],
        cons: ["Brings back the calls we had cut", "A call is not a declaration under the ordinance"],
        cost: "A call for every stalled draft",
        status: "rejected",
      },
    ],
    after: "The summary page lists every item the installer entered, so the owner still declares the whole application.",
  },
  afterLaunch: {
    caption: "After launch in {{log.launch}}: what logs, tickets and trials showed, newest first.",
    entries: [
      {
        date: "{{log.sms}}",
        text: "SMS reminders went to {{afterLaunch.smsDrafts}} stalled drafts in a trial. {{afterLaunch.smsConfirmed}} owners confirmed within {{afterLaunch.smsDays|word}} days of the first text.",
      },
      {
        date: "{{log.stallsDown}}",
        text: "Stalled drafts fell from {{decisions.stalledPct}}% to {{afterLaunch.stalledAfterPct}}% in the {{afterLaunch.windowWeeks|word}} weeks after the one-page confirmation went live.",
      },
      {
        date: "{{log.reversed}}",
        text: "Funnel analytics: {{afterLaunch.stallAtReviewPct}}% of stalled drafts stopped on the section-by-section review. We replaced it with one summary page and a single declaration.",
      },
      {
        date: "{{log.adoption}}",
        text: "{{afterLaunch.delegatedPct}}% of applications arrived as delegated drafts, from {{afterLaunch.firms}} installer firms. The PDF form was withdrawn.",
      },
      {
        date: "{{log.firstMonth}}",
        text: "{{afterLaunch.tickets}} support tickets in the first month, {{afterLaunch.ticketsLogin}} of them about the AGOV login and none about the upload step. We added a login help page in both languages.",
      },
    ],
  },
  results: {
    caption: "Results after {{outcomes.months|word}} months — fictional example data",
    legend: {
      measured: "system logs, first {{outcomes.months}} months after launch, n = {{outcomes.applications}} applications",
      estimated: "extrapolated from a sample",
    },
    rows: [
      {
        metric: "Complete on first submission",
        before: "{{outcomes.complete.before}}%",
        after: "{{outcomes.complete.after}}%",
        evidence: "measured",
        stage: 4,
      },
      {
        metric: "Median time to decision",
        before: "{{outcomes.medianDays.before}} days (sample of {{outcomes.baselineFiles}} files)",
        after: "{{outcomes.medianDays.after}} days",
        evidence: "measured",
        stage: 5,
      },
      {
        metric: "SUS score (directional)",
        before: "{{outcomes.sus.before}} (PDF process)",
        after: "{{outcomes.sus.after}} (final round, n = {{delivery.perRound}})",
        evidence: "measured",
        stage: 5,
      },
      {
        metric: "Caseworker phone calls",
        before: "—",
        after: "≈ {{outcomes.callsPct}}% ({{outcomes.callLogWeeks|word}}-week call log)",
        evidence: "estimated",
        stage: 5,
      },
      {
        metric: "Design-system reuse",
        before: "{{outcomes.reuse.before}} services",
        after: "{{outcomes.reuse.after}} services",
        evidence: "measured",
        stage: 4,
      },
    ],
  },
  lookingBack: [
    {
      lesson: "Legal belonged in the first workshop, not the {{workshops.legalApproved|ordinal}}. The delegated model nearly failed late on a signature question.",
      nextTime: "Next time I would bring legal in at workshop one: a {{reflection.legalMinutes}}-minute conversation in month one would have settled it.",
    },
    {
      lesson: "Prototyping in code early paid for itself. Screen-reader sessions on real components found focus and error-message issues that Figma tests could never have revealed.",
      nextTime: "Next time I would move to coded components as early again, with assistive-technology users in every round.",
    },
    {
      lesson: "Our {{outcomes.medianDays.before}}-day baseline came from a hand-counted sample, which weakens the comparison.",
      nextTime: "Next time I would instrument the baseline before changing anything, so logging comes first.",
    },
    {
      lesson: "The section-by-section review satisfied legal but stalled owners, and we only saw it in the funnel after launch.",
      nextTime: "Next time I would test the owner’s confirmation with owners on their phones before launch.",
    },
  ],
  team: [
    { role: "UX Team Lead", count: "{{roles.lead}}", line: "Set research and design strategy, facilitated the workshops and built the core form patterns." },
    { role: "Product designers", count: "{{team.designersLed}}", line: "Each owned one journey end to end: homeowner, installer or caseworker." },
    { role: "Content designer (French)", count: "{{roles.contentDesigner}}", line: "Wrote the French originals side by side with the German." },
    { role: "Product owner, Energy Office", count: "{{roles.productOwner}}", line: "Owned the service and chaired the steering group." },
    { role: "Angular developers", count: "{{team.developers}}", line: "Built the front end in-house on the extended design system." },
    { role: "Architect", count: "{{team.architects}}", line: "Designed the nightly import into the case system." },
    { role: "Legal adviser", count: "{{roles.legalAdviser}}", line: "Reviewed the decision log every Thursday and signed off the delegated model." },
  ],
  credits:
    "Credits (fictional): Product owner — Energy Office; UX — {{team.ux}}-person team; development — {{team.developers}} Angular developers, {{team.architects}} architect; content (FR) — francophone content designer.",
  figures,
  images,
};

export const caseStudy: CaseStudy = { ...fillDeep(rawCaseStudy, data), assets: assets as Record<string, ImageAsset> };
