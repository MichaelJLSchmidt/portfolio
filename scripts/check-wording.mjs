// Plain wording in the built site: greps every HTML page in ./out (visible text, page titles,
// meta descriptions, alt text and accessible names; links for .pdf) for words the site no
// longer uses and for phrases that would read as job-seeking.
//
//   npm run check:wording              exit 1 on any hit
//   node scripts/check-wording.mjs --dir other-out
//
// `npm run build` runs it after every build; `npm run test:e2e -- wording` too.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

/** What must never appear, and why. */
export const BANNED = [
  { re: /Höhenlinie/i, why: "the old site name (the brand comes from the name source)" },
  { re: /\bexpeditions?\b/i, why: "old wording (Work, Selected work, Next project)" },
  { re: /\bbasecamp\b/i, why: "old wording (About)" },
  { re: /\bCV\b|\bcurriculum vitae\b|\brésumé\b/i, why: "no CV anywhere" },
  { re: /\bopen to\b/i, why: "reads as job-seeking" },
  { re: /\bavailable for\b/i, why: "reads as job-seeking" },
  { re: /\blooking for\b/i, why: "reads as job-seeking" },
];

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

/** The words a reader can see or hear on a page: text, titles, alt text, labels, descriptions. */
export function readableText(html) {
  const body = html.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ");
  const attrs = [...body.matchAll(/\s(?:alt|title|aria-label|aria-description|placeholder|content)="([^"]*)"/gi)].map((m) => m[1]);
  const text = body.replace(/<[^>]+>/g, " ");
  return decode(`${text} ${attrs.join(" ")}`).replace(/\s+/g, " ");
}

/** Every hit in the export at `dir`: { file, word, why, context }. */
export function wordingHits(dir) {
  const files = (d) => readdirSync(d).flatMap((name) => (statSync(join(d, name)).isDirectory() ? files(join(d, name)) : [join(d, name)]));
  const hits = [];
  for (const file of files(dir).filter((f) => f.endsWith(".html"))) {
    const html = readFileSync(file, "utf8");
    const text = readableText(html);
    for (const { re, why } of BANNED) {
      const m = text.match(re);
      if (m) hits.push({ file: relative(root, file), word: m[0], why, context: text.slice(Math.max(0, m.index - 40), m.index + 40) });
    }
    const pdf = html.match(/\shref="[^"]*\.pdf(?:[?#][^"]*)?"/i);
    if (pdf) hits.push({ file: relative(root, file), word: ".pdf", why: "no CV or PDF download", context: pdf[0] });
  }
  return hits;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const i = process.argv.indexOf("--dir");
  const dir = resolve(root, i > 0 ? process.argv[i + 1] : "out");
  if (!existsSync(dir)) {
    console.error(`No export in ${dir}: run npm run build first.`);
    process.exit(2);
  }
  const hits = wordingHits(dir);
  if (hits.length) {
    console.error(`Wording: ${hits.length} hit(s) in ${relative(root, dir) || "."}:`);
    for (const h of hits) console.error(`  ${h.file}: "${h.word}" (${h.why}) … ${h.context} …`);
    process.exit(1);
  }
  console.log(`Wording: no old names, CV or job-seeking phrases in ${relative(root, dir) || "."}.`);
}
