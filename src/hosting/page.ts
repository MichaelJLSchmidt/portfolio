/**
 * The under-construction page production serves and, with the same design, the password gate
 * of preview deploys. One renderer for both, pure string templating so the build (Node) and the
 * gate (Deno) share it. The build assembles the model from src/content and the tokens.
 */

export type PageLink = { label: string; href: string | null };

export type PageModel = {
  lang: string;
  title: string;
  description: string;
  /** Absolute URL of the indexable page; null on the gate. */
  canonical: string | null;
  name: string;
  role: string;
  status: string;
  contact: PageLink[];
  /** Shown instead of a contact link whose URL is still missing (preview builds only). */
  placeholder: (label: string) => string;
  /** The short brand: the page's mark (the name source's `brand`). */
  brand: string;
  /** The mark's outline colour (text-3). */
  outline: string;
  access: {
    heading: string;
    label: string;
    submit: string;
    /** The submit button's label while the password is checked (the inline script sets it). */
    pending: string;
    error: string;
    closed: string;
    /** Account name for password managers; the gate ignores it. */
    username: string;
  };
  credit: PageLink;
  /** Inline <style> and <script> bodies; the build lists their hashes in the CSP. */
  css: string;
  script: string;
  /** Font URLs to preload. */
  preload: string[];
};

/** The model as the gate receives it: JSON, so the placeholder text is precomputed. */
export type SerializedPageModel = Omit<PageModel, "placeholder"> & { placeholders: Record<string, string> };

export type FormState = {
  /** Where the password form posts. */
  action: string;
  /** Path to open after unlocking. */
  next: string;
  /** idle: the form; error: the form after a wrong password; closed: no form (no password set). */
  state: "idle" | "error" | "closed";
};

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function deserialize(model: SerializedPageModel): PageModel {
  return { ...model, placeholder: (label) => model.placeholders[label] ?? label };
}

export function serialize(model: PageModel): SerializedPageModel {
  const { placeholder, ...rest } = model;
  return { ...rest, placeholders: Object.fromEntries(model.contact.map((l) => [l.label, placeholder(l.label)])) };
}

function contactList(page: PageModel): string {
  const items = page.contact.map((link) =>
    link.href
      ? `<li><a href="${escapeHtml(link.href)}"${link.href.startsWith("http") ? ' rel="me"' : ""}>${escapeHtml(link.label)}</a></li>`
      : `<li><span class="pending">${escapeHtml(page.placeholder(link.label))}</span></li>`,
  );
  return `<ul class="contact" data-quiet-zone>${items.join("")}</ul>`;
}

function accessForm(page: PageModel, form: FormState): string {
  const { access } = page;
  if (form.state === "closed") {
    return `<section class="access" aria-labelledby="access-title"><h2 id="access-title" class="visually-hidden">${escapeHtml(access.heading)}</h2><p class="closed">${escapeHtml(access.closed)}</p></section>`;
  }
  const error = form.state === "error";
  // "Look around →": the arrow steps up and right on hover, like the site's survey button.
  const [submit, arrow] = access.submit.match(/^(.*?)\s*(→)?$/)!.slice(1);
  return [
    `<section class="access" aria-labelledby="access-title" data-quiet-zone>`,
    `<h2 id="access-title" class="visually-hidden">${escapeHtml(access.heading)}</h2>`,
    `<form method="post" action="${escapeHtml(form.action)}">`,
    `<input type="hidden" name="next" value="${escapeHtml(form.next)}">`,
    `<input type="text" name="username" value="${escapeHtml(access.username)}" autocomplete="username" hidden>`,
    `<label for="password" class="label">${escapeHtml(access.label)}</label>`,
    `<div class="field">`,
    `<input id="password" name="password" type="password" autocomplete="current-password" required maxlength="1024"`,
    error ? ` aria-invalid="true" aria-describedby="access-error" autofocus>` : ">",
    `<button type="submit" data-pending="${escapeHtml(access.pending)}">${escapeHtml(submit)}${arrow ? `<span data-arrow aria-hidden="true">${arrow}</span>` : ""}</button>`,
    `</div>`,
    error
      ? `<p id="access-error" class="error" role="alert"><svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7.5"/><path d="M9 4.8v5.4M9 12.4v.8"/></svg><span>${escapeHtml(access.error)}</span></p>`
      : "",
    `</form>`,
    `</section>`,
  ].join("");
}

export function renderPage(page: PageModel, form: FormState): string {
  const title = form.state === "error" ? `${page.access.error} · ${page.title}` : page.title;
  const head = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}">`,
    page.canonical
      ? `<link rel="canonical" href="${escapeHtml(page.canonical)}"><meta property="og:type" content="website"><meta property="og:url" content="${escapeHtml(page.canonical)}"><meta property="og:title" content="${escapeHtml(page.title)}"><meta property="og:description" content="${escapeHtml(page.description)}">`
      : `<meta name="robots" content="noindex, nofollow">`,
    `<meta name="color-scheme" content="dark">`,
    `<link rel="icon" href="data:,">`,
    ...page.preload.map((href) => `<link rel="preload" href="${escapeHtml(href)}" as="font" type="font/woff2" crossorigin>`),
    `<style>${page.css}</style>`,
  ];
  const credit = page.credit.href
    ? `<a href="${escapeHtml(page.credit.href)}">${escapeHtml(page.credit.label)}</a>`
    : escapeHtml(page.credit.label);
  // The mark is the brand; the H1 names the person (read once, the brand hidden from it).
  const body = [
    `<div class="terrain" aria-hidden="true"><div class="poster"></div><canvas data-field-canvas></canvas></div>`,
    `<main>`,
    // The relief fill's stack (the script adds its canvas and construction layer) and filters.
    `<h1 class="mark" data-relief-root data-quiet-zone>`,
    `<span class="relief-stack" data-relief-stack aria-hidden="true"><span class="relief-fill" data-relief-fill>${escapeHtml(page.brand)}</span><span class="relief-text" data-relief-text>${escapeHtml(page.brand)}</span></span>`,
    `<span class="visually-hidden">${escapeHtml(page.name)}</span>`,
    `</h1>`,
    `<svg class="defs" width="0" height="0" aria-hidden="true" focusable="false"><filter id="relief-outline" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feMorphology in="SourceAlpha" operator="dilate" radius="1" result="grown"/><feComposite in="grown" in2="SourceAlpha" operator="out" result="ring"/><feFlood flood-color="${escapeHtml(page.outline)}"/><feComposite in2="ring" operator="in"/></filter></svg>`,
    `<p class="role label" data-quiet-zone>${escapeHtml(page.role)}</p>`,
    `<p class="status" data-quiet-zone>${escapeHtml(page.status)}</p>`,
    accessForm(page, form),
    contactList(page),
    `</main>`,
    `<footer class="label">${credit}</footer>`,
    `<script>${page.script}</script>`,
  ];
  return `<!doctype html><html lang="${escapeHtml(page.lang)}"><head>${head.join("")}</head><body>${body.join("")}</body></html>\n`;
}
