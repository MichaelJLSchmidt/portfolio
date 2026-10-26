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
  banner: {
    label: "Model case study · Fictional example",
    text: "the canton, people and figures are invented to demonstrate the page format.",
  },
  lede: "A bilingual subsidy service where {{outcomes.complete.after}}% of applications are now complete on first submission.",
  typeLine: "Service design · Public sector · UX Team Lead · {{project.months}} months · {{years.start}}–{{years.end}} (fictional)",
  metaDescription: "Fictional model case study demonstrating a senior UX case study format.",
  summary: {
    problem:
      "{{problem.incompletePct}}% of heating-subsidy applications arrived incomplete. Homeowners waited a median {{problem.medianDays}} days for a decision.",
    role: "UX Team Lead. I set research and design strategy, facilitated {{workshops.count}} cross-unit workshops, led {{team.designersLed}} designers and built the core form patterns in Angular.",
    team: "{{team.ux}} UX + {{team.productDev}} product & dev",
    duration: "{{project.months}} months",
    reach: "~{{reach.perYear|en}} applications a year in German and French",
    keyDecision:
      "Let installers prepare the application and homeowners confirm it via AGOV, instead of forcing homeowners through a {{pdf.pages}}-page form alone.",
    outcome: [
      { text: "Incomplete submissions {{outcomes.incomplete.before}}% → {{outcomes.incomplete.after}}%", evidence: "measured" },
      { text: "Median time to decision {{outcomes.medianDays.before}} → {{outcomes.medianDays.after}} days", evidence: "measured" },
      { text: "Caseworker calls ≈ {{outcomes.callsPct}}%", evidence: "estimated" },
    ],
    note: "Fictional example data.",
  },
  hero: "tp-hero",
  waypoints: [
    {
      id: "context",
      nav: "Context",
      label: "Context & constraints",
      finding: "a PDF, an inbox and a {{years.caseSystem}} case system",
      blocks: [
        {
          kind: "p",
          text: "The fictional Canton of Hochmatt pays homeowners up to CHF {{subsidy.maxChf|en}} to replace an oil or gas heating with a heat pump or district heating. Demand tripled after {{years.demandRise}}, but the process was still a {{pdf.pages}}-page PDF, a shared e-mail inbox and a case-management system from {{years.caseSystem}}. {{problem.incompletePct}}% of applications arrived incomplete. {{problem.caseworkers|Word}} caseworkers spent about a third of their time chasing documents, and homeowners waited a median {{problem.medianDays}} days for a decision.",
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
      label: "Leadership",
      finding: "from “digitise the PDF” to one measurable goal",
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
              text: "With the steering group, I replaced “digitise the PDF” with “complete on first submission”. It became the project’s north-star metric and the yardstick for every later trade-off.",
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
          lead: "What I did not do:",
          text: "final illustration work, the batch-import integration, and the French copy, which a francophone content designer owned.",
        },
      ],
    },
    {
      id: "discovery",
      nav: "Discovery",
      label: "Discovery",
      finding: "the form was asking the wrong person",
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
              lead: "“Incomplete” mostly meant {{discovery.documents|word}} documents.",
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
        },
        {
          kind: "p",
          text: "{{discovery.archetypes|Word}} archetypes replaced the single “applicant” in every later discussion: the Delegating Owner, the Busy Installer and the Careful Caseworker.",
        },
        { kind: "figure", id: "tp-archetypes" },
        { kind: "figure", id: "tp-blueprint-current" },
      ],
    },
    {
      id: "decisions",
      nav: "Decisions",
      label: "Key decisions & trade-offs",
      finding: "we designed the hand-off, not the form",
      blocks: [
        {
          kind: "decision",
          id: "who-applies",
          title: "Who applies?",
          options: {
            caption: "Three application models",
            columns: ["Option", "For", "Against"],
            rows: [
              { option: "A. Homeowner-only digital form", pro: "Lowest legal risk", con: "Repeats today’s failure: owners lack the technical data" },
              { option: "B. Installer applies alone", pro: "Fastest, data is accurate", con: "Not allowed: the ordinance requires the owner’s declaration" },
              {
                option: "C. Delegated application: installer prepares, homeowner reviews and confirms via AGOV",
                pro: "Right data from the right person; legally sound",
                con: "Two people, two logins, a new waiting state",
                chosen: true,
              },
            ],
          },
          chose: "C.",
          cost: "In beta, {{decisions.stalledPct}}% of delegated drafts stalled at the homeowner’s confirmation.",
          mitigation: "A share link, {{decisions.reminders|word}} reminder e-mails, and a paper confirmation form as a fallback.",
          after:
            "Legal approved C in the {{workshops.legalApproved|ordinal}} workshop once the decision log showed that the owner’s declaration stayed intact.",
        },
        { kind: "figure", id: "tp-decision-matrix" },
        {
          kind: "decision",
          id: "pre-check",
          title: "Check eligibility before login?",
          text: [
            "Putting everything behind AGOV was simpler to build. A {{decisions.precheckQuestions|word}}-question anonymous pre-check tells about {{decisions.notEligible.one}} in {{decisions.notEligible.in}} visitors they are not eligible before they create an account.",
          ],
          chose: "The pre-check.",
          cost: "The eligibility rules exist in two places.",
          mitigation: "A single, versioned rules file that legal reviews whenever the ordinance changes.",
        },
        {
          kind: "decision",
          id: "build-or-buy",
          title: "Buy a form builder or extend our design system?",
          text: [
            "The vendor’s form builder promised a demo in {{decisions.vendorDemoWeeks|word}} weeks, but an accessibility pre-check found {{decisions.vendorIssues}} issues. Extending Angular Material with cantonal design tokens meant {{decisions.firstDemoWeeks|word}} weeks before the first demo.",
          ],
          chose: "To extend.",
          cost: "A slower start and a nervous steering group.",
          mitigation:
            "I made the case with the audit findings and the reuse potential, and the {{decisions.components}} resulting components are now used by {{decisions.reuseServices|word}} other services.",
        },
        {
          kind: "p",
          lead: "Deliberately not built:",
          text: "a live status tracker. With a nightly batch, any “live” status would have been fiction. The status page says what is true: “Received — review starts within {{decisions.statusWorkingDays}} working days.”",
        },
      ],
    },
    {
      id: "delivery",
      nav: "Design & delivery",
      label: "Design & delivery",
      finding: "tested in code, in two languages",
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
          text: "{{delivery.rounds|word}} moderated rounds of {{delivery.perRound}} participants each ({{delivery.participants}} in total; {{delivery.inFrench}} in French; {{delivery.assistiveTech}} using screen readers or magnification). Task success for “submit a complete application” rose from {{delivery.success.r1}}/{{delivery.perRound}} to {{delivery.success.r2}}/{{delivery.perRound}} to {{delivery.success.r3}}/{{delivery.perRound}}.",
        },
        {
          kind: "p",
          lead: "Content:",
          text: "plain-language German and French written in parallel, not translated afterwards. Legal terms moved into expandable “Why we ask” hints.",
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
      label: "Outcome & reflection",
      finding: "faster decisions, one honest gap",
      blocks: [
        {
          kind: "metrics",
          label: "Outcomes at a glance",
          items: [
            {
              value: "{{outcomes.complete.after}}%",
              label: "complete on first submission",
              detail: "from {{outcomes.complete.before}}%",
              evidence: "measured",
            },
            {
              value: "{{outcomes.medianDays.after}} days",
              label: "median time to decision",
              detail: "from {{outcomes.medianDays.before}} days",
              evidence: "measured",
            },
            { value: "≈ {{outcomes.callsPct}}%", label: "caseworker phone calls", detail: "from a call log", evidence: "estimated" },
          ],
        },
        {
          kind: "outcomes",
          caption: "Outcomes — fictional example data",
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
            },
            {
              metric: "Median time to decision",
              before: "{{outcomes.medianDays.before}} days",
              after: "{{outcomes.medianDays.after}} days",
              evidence: "measured",
              note: "baseline: manual sample of {{outcomes.baselineFiles}} files",
            },
            {
              metric: "SUS score",
              before: "{{outcomes.sus.before}} (PDF process)",
              after: "{{outcomes.sus.after}} (final round)",
              evidence: "measured",
              note: "n = {{delivery.perRound}} per round — directional",
            },
            {
              metric: "Caseworker phone calls",
              before: "—",
              after: "≈ {{outcomes.callsPct}}%",
              evidence: "estimated",
              note: "from a {{outcomes.callLogWeeks}}-week call log",
            },
            {
              metric: "Design-system reuse",
              before: "{{outcomes.reuse.before}} services",
              after: "{{outcomes.reuse.after}} services",
              evidence: "measured",
            },
          ],
        },
        { kind: "figure", id: "tp-outcomes" },
        {
          kind: "p",
          lead: "What did not improve:",
          text: "{{decisions.stalledPct}}% of delegated drafts still stall at homeowner confirmation. We are testing SMS reminders next.",
        },
        {
          kind: "list",
          intro: "Reflection:",
          items: [
            {
              lead: "Bring legal in at workshop one, not workshop {{workshops.legalApproved|word}}.",
              text: "The delegated model nearly failed late on a signature question that a {{reflection.legalMinutes}}-minute conversation in month one would have settled.",
            },
            {
              lead: "Prototyping in code early paid for itself.",
              text: "Screen-reader sessions on real components found focus and error-message issues that Figma tests could never have revealed.",
            },
            {
              lead: "Instrument the baseline before you change anything.",
              text: "Our {{outcomes.medianDays.before}}-day figure came from a hand-counted sample, which weakens the comparison. On the next service, logging comes first.",
            },
          ],
        },
      ],
    },
  ],
  credits:
    "Credits (fictional): Product owner — Energy Office; UX — {{team.ux}}-person team; development — {{team.developers}} Angular developers, {{team.architects}} architect; content (FR) — francophone content designer.",
  figures,
  images,
};

export const caseStudy: CaseStudy = { ...fillDeep(rawCaseStudy, data), assets: assets as Record<string, ImageAsset> };
