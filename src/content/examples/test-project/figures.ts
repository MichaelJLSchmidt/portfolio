import type { FigureSpec, ImageSpec } from "@/lib/case-study";

/**
 * Test Project figures: what each image is, how the page shows it, and its words (alt text,
 * caption, long description). Images are rendered from artefacts/test-project by
 * `npm run images`, at the master size given here (2x); numbers are {{tokens}} into data.ts.
 * Figure numbers follow the order of appearance on the page.
 */
export const images: Record<string, ImageSpec> = {
  "tp-hero": {
    alt: "Fictional subsidy application screen showing step {{product.firstStep}} of {{product.steps}}, eligibility check, in German.",
    width: 2560,
    height: 1440,
  },
  "tp-landscape": { alt: "Service landscape map of actors, channels, systems and {{landscape.constraints|word}} constraints.", width: 2400, height: 1500 },
  "tp-workshop-board": {
    alt: "Workshop board comparing {{workshops.options|word}} application models, with option C, delegated application, chosen.",
    width: 2400,
    height: 1600,
  },
  "tp-affinity": {
    alt: "Affinity map with {{discovery.themes|word}} theme clusters; {{discovery.insights|word}} highlighted themes are described in the text.",
    width: 2400,
    height: 1500,
  },
  "tp-archetypes": { alt: "Three archetype cards: Delegating Owner, Busy Installer and Careful Caseworker.", width: 2400, height: 800 },
  "tp-blueprint-current": { alt: "Current-state service blueprint; full description follows.", width: 2800, height: 1200 },
  "tp-decision-matrix": {
    alt: "Decision matrix rating {{workshops.options|word}} options on four criteria; option C scores best on legal fit and data quality.",
    width: 1600,
    height: 1200,
  },
  "tp-flow": { alt: "User flow from eligibility pre-check to submission; described in the list below.", width: 2800, height: 1200 },
  "tp-sketch-to-wire": { alt: "Three stages of the document-upload step: sketch, wireframe and coded prototype.", width: 2400, height: 800 },
  "tp-before": { alt: "Before: dense PDF form page with {{pdf.comparedFields}} fields.", width: 2400, height: 1500 },
  "tp-after": { alt: "After: one-question-per-section step with example document and help hint.", width: 2400, height: 1500 },
  "tp-annotated-upload": {
    alt: "Annotated upload screen with {{product.uploadNotes|word}} numbered design notes; notes are listed below.",
    width: 2880,
    height: 1800,
  },
  "tp-design-system": { alt: "Design-system sheet with colour tokens, type scale and six form components.", width: 2400, height: 1500 },
  "tp-test-rounds": {
    alt: "Task success rose from {{delivery.success.r1}} of {{delivery.perRound}} to {{delivery.success.r2}} of {{delivery.perRound}} to {{delivery.success.r3}} of {{delivery.perRound}} across {{delivery.rounds|word}} test rounds.",
    width: 1920,
    height: 1080,
  },
  "tp-outcomes": {
    alt: "Slope chart: completeness up from {{outcomes.complete.before}}% to {{outcomes.complete.after}}%, decision time down from {{outcomes.medianDays.before}} to {{outcomes.medianDays.after}} days; details in the results table.",
    width: 1920,
    height: 1080,
  },
};

export const figures: Record<string, FigureSpec> = {
  "tp-hero": { kind: "image", image: "tp-hero", surface: "night", size: "wide", source: "Fictional product UI" },
  "tp-landscape": {
    kind: "image",
    image: "tp-landscape",
    surface: "sheet",
    size: "wide",
    source: "Discovery research (fictional)",
    zoom: true,
    caption:
      "{{landscape.constraints|Word}} constraints and {{landscape.actors|word}} actors framed every decision. The nightly batch import set the limits for status feedback.",
    long: [
      {
        text: "Actors ({{landscape.actors}})",
        items: [
          "Homeowner: applies for the subsidy and must declare it personally.",
          "Installer: quotes, installs and in practice fills in most forms.",
          "Energy Office caseworkers ({{problem.caseworkers}}): check files and decide.",
          "Product owner, Energy Office: owns the service.",
          "Legal service: interprets the subsidy ordinance.",
          "IT provider: runs the cantonal infrastructure and AGOV integration.",
          "Case-system vendor: maintains the case system under a fixed contract.",
        ],
      },
      {
        text: "Channels",
        items: ["{{pdf.pages}}-page PDF form", "Shared e-mail inbox", "Phone", "AGOV login (planned for the new service)"],
      },
      { text: "Systems", items: ["Case-management system from {{years.caseSystem}}", "Nightly batch import into the case system"] },
      {
        text: "Constraint pins",
        items: [
          "Law: the owner’s own declaration is required (on the homeowner).",
          "Accessibility: WCAG 2.1 AA following eCH-0059 (on all channels).",
          "DE/FR: German and French are equal originals (on the PDF form).",
          "AGOV: login for applicants (on the AGOV channel).",
          "Legacy: nightly batch only; a real-time API is {{api.monthsAway}} months away (on the batch import).",
          "Procurement: the vendor contract cannot be reopened (on the case-system vendor).",
        ],
      },
      "Documents travel from installer to homeowner to the inbox; caseworkers re-key them into the case system, which only learns about them overnight.",
    ],
  },
  "tp-workshop-board": {
    kind: "image",
    image: "tp-workshop-board",
    surface: "sheet",
    size: "wide",
    source: "Decision workshop board (fictional)",
    zoom: true,
    caption: "Decision workshop board. Making the decision rule explicit let legal sign off in the room.",
    long: [
      {
        text: "Options",
        items: [
          "A. Homeowner-only digital form: {{workshops.votes.a}} dots.",
          "B. Installer applies alone: {{workshops.votes.b}} dots.",
          "C. Delegated: installer prepares, owner confirms with AGOV: {{workshops.votes.c}} dots, outlined as “Decision: C – delegated”.",
        ],
      },
      {
        text: "Must be true (legal)",
        items: ["The owner’s own declaration stays intact.", "The owner confirms with an AGOV login.", "Data entered by the installer is marked “prepared by”."],
      },
      { text: "Risks", items: ["The owner never confirms: the draft stalls.", "Two people need two logins.", "A wrong owner e-mail sends the link astray."] },
      {
        text: "Decision rule",
        items: ["Choose the option that meets the ordinance and puts each item with the person who knows it.", "Legal may veto; otherwise the dots decide."],
      },
      "Notes are coloured by unit: Energy Office, Legal service, IT and UX. A hand-written annotation reads “1-2-4-All, {{workshops.participants}} participants”.",
    ],
  },
  "tp-affinity": {
    kind: "image",
    image: "tp-affinity",
    surface: "sheet",
    size: "wide",
    source: "Interview notes (fictional)",
    zoom: true,
    caption:
      "{{discovery.interviews}} interviews, about {{discovery.observations}} observations, {{discovery.themes}} themes. {{discovery.insights|Word}} themes changed the brief.",
  },
  "tp-archetypes": {
    kind: "image",
    image: "tp-archetypes",
    surface: "sheet",
    size: "wide",
    source: "Interviews and shadowing (fictional)",
    zoom: true,
    caption: "{{discovery.archetypes|Word}} archetypes, built from behaviour rather than demographics.",
    long: [
      {
        text: "Delegating Owner",
        items: [
          "Goal: get the subsidy without becoming a heating expert.",
          "Key frustration: asked for technical data only the installer has.",
          "Knows: owner details, the property, the budget. Doesn’t know: heat-pump model, heated floor area, certificate number.",
          "Observed: forwards every technical question to the installer.",
        ],
      },
      {
        text: "Busy Installer",
        items: [
          "Goal: close the job and get the customer’s subsidy approved fast.",
          "Key frustration: re-typing the same data into every canton’s PDF.",
          "Knows: model, output, floor area, the quote. Doesn’t know: ownership details, the owner’s login.",
          "Observed: fills in forms after hours, on a phone, between jobs.",
        ],
      },
      {
        text: "Careful Caseworker",
        items: [
          "Goal: decide on complete, legally sound files.",
          "Key frustration: chasing missing documents by phone.",
          "Knows: the ordinance and the case system. Doesn’t know: whether a file is complete before opening it.",
          "Observed: spends most of the day phoning applicants for missing documents.",
        ],
      },
    ],
  },
  "tp-blueprint-current": {
    kind: "image",
    image: "tp-blueprint-current",
    surface: "sheet",
    size: "wide",
    source: "Blueprint workshop with caseworkers (fictional)",
    zoom: true,
    caption: "Current service: {{discovery.handoffs}} hand-offs and {{discovery.gaps}} moments without any feedback to the applicant.",
    long: [
      { text: "Applicant", items: ["Learns about the subsidy.", "Asks an installer for a quote.", "Signs the PDF and e-mails it with attachments.", "Waits for a decision."] },
      { text: "Installer", items: ["Prepares the quote.", "Fills in the technical pages of the PDF."] },
      { text: "Frontstage (PDF, e-mail)", items: ["PDF form and guidance", "Shared inbox receives the application", "E-mails and calls asking for missing documents", "Decision letter"] },
      { text: "Backstage (caseworker)", items: ["Checks completeness by hand.", "Chases missing documents.", "Re-keys the case into the case system.", "Decides."] },
      { text: "Systems", items: ["Shared mailbox", "Nightly batch import", "Case system from {{years.caseSystem}}"] },
      {
        text: "Hand-offs ({{discovery.handoffs}})",
        items: [
          "Applicant to installer (quote request)",
          "Installer to applicant (filled PDF)",
          "Applicant to inbox (application)",
          "Inbox to caseworker",
          "Caseworker to applicant (missing documents)",
          "Caseworker to case system (re-keying)",
          "Batch import to caseworker (case ready)",
        ],
      },
      {
        text: "Moments without feedback ({{discovery.gaps}})",
        items: [
          "After e-mailing the application: no receipt.",
          "While the file waits in the inbox: no status.",
          "After the nightly import: no confirmation that the case exists.",
          "While waiting for the decision, a median {{problem.medianDays}} days: no update.",
        ],
      },
    ],
  },
  "tp-decision-matrix": {
    kind: "image",
    image: "tp-decision-matrix",
    surface: "sheet",
    size: "column",
    source: "Decision workshop ratings (fictional)",
    caption: "Option C was the only one that met the ordinance and put the right data in the right hands.",
    long: [
      "Ratings out of {{matrix.scale}} filled dots; more dots are better (for effort: less effort).",
      "A. Homeowner-only form: legal fit {{matrix.a.legal}}, data quality {{matrix.a.data}}, effort for owner {{matrix.a.owner}}, build effort {{matrix.a.build}}.",
      "B. Installer alone: legal fit {{matrix.b.legal}}, data quality {{matrix.b.data}}, effort for owner {{matrix.b.owner}}, build effort {{matrix.b.build}}.",
      "C. Delegated: legal fit {{matrix.c.legal}}, data quality {{matrix.c.data}}, effort for owner {{matrix.c.owner}}, build effort {{matrix.c.build}}. Outlined as the choice.",
      "Footnote: ratings from the decision workshop, n = {{workshops.participants}}.",
    ],
  },
  "tp-flow": {
    kind: "image",
    image: "tp-flow",
    surface: "sheet",
    size: "wide",
    source: "Service design (fictional)",
    zoom: true,
    caption: "New flow: an eligibility check before login and a delegated hand-off from installer to owner.",
    long: [
      {
        text: "New decision point: anonymous pre-check ({{decisions.precheckQuestions}} questions, no login)",
        items: ["Not eligible: exit with the reason and where to get advice.", "Eligible: continue."],
      },
      "Installer creates a draft with the technical data and the documents.",
      {
        text: "New decision point: delegated hand-off",
        items: [
          "Installer sends a share link to the owner.",
          "Owner logs in with AGOV, reviews the prepared data and confirms the declaration.",
          "No confirmation: {{decisions.reminders}} reminder e-mails, then a paper confirmation form.",
        ],
      },
      "Submitted: “Received — review starts within {{decisions.statusWorkingDays}} working days.”",
      "Nightly batch import into the case system, then the caseworker reviews a structured, complete case.",
    ],
  },
  "tp-sketch-to-wire": {
    kind: "image",
    image: "tp-sketch-to-wire",
    surface: "sheet",
    size: "wide",
    source: "Design studio and coded prototype (fictional)",
    zoom: true,
    caption: "The document-upload step from design-studio sketch to coded prototype in {{delivery.prototypeWeek|word}} weeks.",
  },
  "tp-compare": {
    kind: "compare",
    before: "tp-before",
    after: "tp-after",
    surface: "sheet",
    size: "wide",
    source: "PDF form and new service (fictional)",
    caption:
      "Before and after: page {{pdf.comparedPage}} of the PDF versus the new “System details” step. Drag or use the arrow keys to compare.",
  },
  "tp-annotated-upload": {
    kind: "hotspots",
    image: "tp-annotated-upload",
    surface: "sheet",
    size: "wide",
    source: "Coded prototype (fictional)",
    zoom: true,
    caption: "Document upload, annotated. Each marker targets one of the {{discovery.documents|word}} most common reasons for returns.",
    notes: [
      { title: "Named document plus example", text: "Asks for “the installer’s quote”, not “attachments”, and shows what one looks like." },
      { title: "Accepted formats in plain language", text: "“A photo or PDF, up to {{ui.maxUploadMb}} MB” instead of a list of file extensions." },
      { title: "Error linked to the field", text: "The message sits next to the upload it belongs to and says how to fix it." },
      { title: "“Why we ask”", text: "A disclosure explains the legal reason in one sentence, without legal terms in the label." },
      { title: "Save and share with the owner", text: "The installer saves the draft and sends the owner a link to review and confirm." },
    ],
  },
  "tp-design-system": {
    kind: "image",
    image: "tp-design-system",
    surface: "sheet",
    size: "wide",
    source: "Design system (fictional)",
    zoom: true,
    caption: "{{decisions.components}} components themed with cantonal tokens. Contrast ratios are documented next to every colour pair.",
    long: [
      "Colour tokens: canton blue, neutrals, error and success, each with its contrast ratio against white or text.",
      "Type scale in Source Sans 3 and a spacing scale in steps of four.",
      "Components: stepper, form field with error, file upload, radio card, alert and a button set, each labelled with its token names.",
    ],
  },
  "tp-test-rounds": {
    kind: "image",
    image: "tp-test-rounds",
    surface: "night",
    size: "column",
    source: "Usability test rounds (fictional data)",
    caption:
      "Task success over {{delivery.rounds|word}} rounds of testing (n = {{delivery.perRound}} each). These are small samples, so read them as directional.",
  },
  "tp-outcomes": {
    kind: "image",
    image: "tp-outcomes",
    surface: "night",
    size: "column",
    source: "Case-system export (fictional)",
    caption: "Outcomes after {{outcomes.months|word}} months. Solid lines are measured; dashed lines are estimated. All data is fictional.",
  },
};
