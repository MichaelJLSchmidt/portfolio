import { about } from "@/content/about";
import { cards } from "@/content/cards";
import { contact } from "@/content/contact";
import { home } from "@/content/home";
import { site } from "@/content/site";
import { nameLines } from "./name-lines";

export { titleKey } from "./title-key";


/**
 * Every display title on the site (WeightTitle), upper-cased as they are set: the hero name (its
 * lines joined by "\n"), the brand, the section titles, the case-study names, About's and the
 * 404's. The build measures each one's widths along the way (scripts/measure-titles.mjs →
 * title-axes.json); this list is the only place that says which strings that is, so a new title
 * or a changed name is measured on the next build.
 */
export function displayTitles(): string[] {
  const titles = [
    nameLines(site.hero.name).join("\n"),
    site.brand,
    home.lead.heading,
    home.work.heading,
    home.earlier.heading,
    contact.heading,
    about.header.heading,
    about.who.heading,
    about.workingRules.heading,
    about.start.heading,
    about.skills.heading,
    about.career.heading,
    about.cards.heading,
    about.craft.heading,
    site.notFound.heading,
    ...cards.map((c) => c.name),
  ];
  return [...new Set(titles.map((t) => t.toUpperCase()))];
}
