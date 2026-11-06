import type { FigureSpec, ImageSpec } from "@/lib/case-study";

/**
 * Gratweg figures: what each image is, how the page shows it, and its words (alt text, caption,
 * long description). Images are rendered from artefacts/gratweg by `npm run images`, at the
 * master size given here (2x); numbers are {{tokens}} into data.ts. Figure numbers follow the
 * order of appearance on the page.
 */
export const images: Record<string, ImageSpec> = {
  "gw-hero": {
    alt: "Swatch audit: the primary blue of each of the {{landscape.products|word}} products side by side, {{landscape.blues|word}} different blues in all, above the single blue token that replaced them.",
    width: 2560,
    height: 1440,
  },
  "gw-coalition": {
    alt: "The co-signed one-page proposal: the problem, the business case of {{businessCase.datePickerHours}} rebuild hours, the pilot terms and {{coalition.signatories|word}} signatures.",
    width: 1600,
    height: 1200,
  },
  "gw-pareto": {
    alt: "Pareto chart of {{inventory.patterns}} UI patterns by number of instances; the first {{inventory.core}} cover {{inventory.coverPct}}% of {{inventory.instances|en}} instances.",
    width: 1920,
    height: 1080,
  },
  "gw-options": {
    alt: "Options comparison for the foundation: custom library, commercial kit and Angular Material with own tokens, rated on time to benefit, accessibility, cost and brand fit; the last is chosen.",
    width: 2400,
    height: 940,
  },
  "gw-governance": {
    alt: "Governance model: contributors propose on an RFC, the core team decides within {{governance.rfcDays}} days, and a fast lane decides small changes within {{governance.fastLaneDays|word}} days.",
    width: 2400,
    height: 1500,
  },
  "gw-pipeline": {
    alt: "Token pipeline in five steps: Figma variables, CI with a read-only key, Style Dictionary, the Angular Material theme, and the product packages.",
    width: 2800,
    height: 1000,
  },
  "gw-adoption": {
    alt: "Adoption dashboard: products on the system per quarter over {{project.months}} months, rising from {{outcomes.products.before}} to {{outcomes.products.after}} of {{landscape.products}}, with a status per product.",
    width: 2400,
    height: 1080,
  },
  "gw-a11y-chart": {
    alt: "Paired bars of accessibility issues per product before and after adoption; every product drops, {{audit.changePct}}% in total.",
    width: 1920,
    height: 1080,
  },
  "gw-before-after": {
    alt: "The same address form in three products, before with three different looks and after with one shared look from the system.",
    width: 2400,
    height: 1500,
  },
};

export const figures: Record<string, FigureSpec> = {
  "gw-hero": { kind: "image", image: "gw-hero", surface: "night", size: "wide", source: "Swatch audit of the products (fictional)" },
  "gw-coalition": {
    kind: "image",
    image: "gw-coalition",
    surface: "sheet",
    size: "column",
    zoom: true,
    caption: "The co-signed proposal. The business case used the teams’ own hours, so nobody had to take my word for it.",
    source: "Proposal to the steering board, {{years.start}} (fictional)",
    long: [
      "Problem: {{landscape.auditFailed}} of {{landscape.products}} products fail WCAG 2.1 AA; {{landscape.libraries}} UI libraries, {{landscape.blues}} primary blues.",
      "Business case: about {{businessCase.datePickerHours}} hours spent rebuilding one date picker across the teams.",
      {
        text: "Pilot terms",
        items: [
          "{{pilot.months|Word}} months, {{pilot.products|word}} products.",
          "Continue only if both pilot products ship a release on the system.",
          "Core team of {{team.core|word}}; contributors from the product teams.",
        ],
      },
      "Signed by {{coalition.leadDevelopers|word}} lead developers, the accessibility officer and the Head of Digital Services.",
    ],
  },
  "gw-pareto": {
    kind: "image",
    image: "gw-pareto",
    surface: "night",
    size: "column",
    caption: "{{inventory.instances|en}} UI instances, {{inventory.patterns}} patterns. The first {{inventory.core}} cover {{inventory.coverPct}}% of screens, so that is where the first version stopped.",
    source: "UI inventory, {{years.start}} (fictional)",
  },
  "gw-options": {
    kind: "image",
    image: "gw-options",
    surface: "sheet",
    size: "wide",
    zoom: true,
    caption: "The foundation decision on one sheet. Angular Material lost on brand fit and won on everything a citizen would notice.",
    source: "Foundation review (fictional)",
    long: [
      "Custom component library: slow time to benefit, accessibility to build ourselves, highest cost, full brand fit.",
      "Commercial kit: fast start, accessibility varies, licence cost, a second visual language.",
      "Angular Material with our own tokens: fast for teams that already use it, accessibility built in, low cost, some brand compromises. Chosen.",
    ],
  },
  "gw-governance": {
    kind: "image",
    image: "gw-governance",
    surface: "sheet",
    size: "wide",
    zoom: true,
    caption: "Governance: the core team owns, contributors propose. The fast lane came after an icon needed a full RFC.",
    source: "Contribution guidelines (fictional)",
    long: [
      "A contributor writes a one-page RFC: the problem, the proposal, who it affects.",
      {
        text: "Fast lane (small changes: an icon, a token value, a fix)",
        items: ["A core-team member decides within {{governance.fastLaneDays|word}} days."],
      },
      {
        text: "Full RFC",
        items: ["Open for comments; the core team decides within {{governance.rfcDays}} days.", "Accepted: built by the contributor with a core-team reviewer.", "Declined: the reason is written on the RFC."],
      },
      "Every decision is listed in the release notes, with the contributor’s name.",
    ],
  },
  "gw-pipeline": {
    kind: "image",
    image: "gw-pipeline",
    surface: "sheet",
    size: "wide",
    zoom: true,
    caption: "The token pipeline. A colour changes in one place, and every product gets it with one package update.",
    source: "Token pipeline documentation (fictional)",
    long: [
      "Figma variables: designers change a token.",
      "CI: reads the variables with a read-only key.",
      "Style Dictionary: turns them into code.",
      "Angular Material theme: the generated theme.",
      "Product packages: teams update one package.",
    ],
  },
  "gw-adoption": {
    kind: "image",
    image: "gw-adoption",
    surface: "sheet",
    size: "wide",
    zoom: true,
    caption: "The adoption dashboard every team could see. Counting automatically ended the arguments about whose numbers were right.",
    source: "Design-system analytics, package downloads (fictional)",
  },
  "gw-a11y-chart": {
    kind: "image",
    image: "gw-a11y-chart",
    surface: "night",
    size: "column",
    caption: "Accessibility issues per product, before and after adoption. Every product dropped; most of the remaining issues are in content, not components.",
    source: "External accessibility audits (fictional)",
  },
  "gw-before-after": {
    kind: "image",
    image: "gw-before-after",
    surface: "sheet",
    size: "wide",
    zoom: true,
    caption: "The same address form in three products, before and after. Citizens now meet one authority, not several.",
    source: "Product screenshots, before and after (fictional)",
  },
};
