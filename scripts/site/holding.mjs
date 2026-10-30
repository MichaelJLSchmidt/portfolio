// The under-construction page's assets and model, shared by the under-construction page
// (construction mode) and the password gate (basecamp mode): fonts, posters, CSS from the
// design tokens, the tiny inline script and the copy from src/content/about.ts.
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import "../lib/ts-hooks.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { about, holding } = await import("../../src/content/about.ts");
const { site } = await import("../../src/content/site.ts");
const { tokensToCss } = await import("../../src/styles/tokens.ts");
const { fieldConfig, posterMedia } = await import("../../src/components/terrain/field-settings.ts");
const terrain = JSON.parse(readFileSync(join(root, "public/terrain/terrain.json"), "utf8"));

const sha256 = (data) => createHash("sha256").update(data).digest();
const fontDir = join(root, "src/hosting/fonts");

/**
 * Copies the page's fonts and posters into `dir` under content-hashed names and returns
 * their URLs under `prefix`.
 */
export function copyAssets(dir, prefix) {
  mkdirSync(dir, { recursive: true });
  const put = (source) => {
    const ext = extname(source);
    const name = `${basename(source, ext)}.${sha256(readFileSync(source)).toString("hex").slice(0, 10)}${ext}`;
    copyFileSync(source, join(dir, name));
    return `${prefix}${name}`;
  };
  const poster = (interval) => terrain.posters.find((p) => p.intervalM === interval) ?? terrain.poster;
  const fine = poster(100);
  return {
    fonts: {
      display: put(join(fontDir, "archivo-display.woff2")),
      text: put(join(fontDir, "archivo-text.woff2")),
      mono: put(join(fontDir, "martian-mono.woff2")),
    },
    // 200 m contours on small screens, 100 m where the site's field would draw them too.
    poster: {
      coarse: put(join(root, "public", poster(200).file)),
      fine: put(join(root, "public", fine.file)),
      fineMedia: posterMedia(terrain.heightmaps, fine.intervalM, fieldConfig),
    },
  };
}

function css({ fonts, poster }) {
  const label = `font:500 var(--type-mono-size)/1.4 "Martian Mono",ui-monospace,monospace;letter-spacing:var(--type-mono-tracking);text-transform:uppercase`;
  return [
    tokensToCss(),
    `@font-face{font-family:"Archivo Display";src:url(${fonts.display}) format("woff2");font-weight:800;font-display:swap}`,
    `@font-face{font-family:"Archivo Text";src:url(${fonts.text}) format("woff2");font-weight:400;font-display:swap}`,
    `@font-face{font-family:"Martian Mono";src:url(${fonts.mono}) format("woff2");font-weight:500;font-display:swap}`,
    `:root{--poster:url(${poster.coarse});--gutter:16px;color-scheme:dark}`,
    `@media ${poster.fineMedia}{:root{--poster:url(${poster.fine})}}`,
    `@media (min-width:48rem){:root{--gutter:40px}}`,
    `*,*::before,*::after{box-sizing:border-box}`,
    `html{-webkit-text-size-adjust:100%;text-size-adjust:100%;background:var(--color-ground)}`,
    `body{margin:0;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;color:var(--color-paper-dusk);font:400 var(--type-body-size)/var(--type-body-lh) "Archivo Text",system-ui,sans-serif}`,
    // Terrain: the poster dimmed so its regular lines show at 23% (it draws them at the
    // field's desktop strength) and a vignette that keeps the text legible. Nothing follows the
    // pointer.
    `.terrain{position:fixed;inset:0;z-index:-1;overflow:hidden}`,
    `.poster{position:absolute;inset:0;background:var(--poster) center/cover no-repeat}`,
    `.poster{opacity:${Math.min(1, 0.23 / fieldConfig.desktop.lineOpacity).toFixed(2)}}`,
    `.terrain::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgb(27 28 24/.9),transparent 18%,transparent 82%,rgb(27 28 24/.9)),radial-gradient(130% 85% at 0% 55%,rgb(27 28 24/.88) 0,rgb(27 28 24/.6) 45%,rgb(27 28 24/0) 80%)}`,
    // The site's cartographic halo (.map-halo): text stays legible over any line, lit or not.
    `.hud,main,footer{text-shadow:0 0 2px var(--color-ground),0 0 6px var(--color-ground),0 0 14px var(--color-ground)}`,
    `input,button{text-shadow:none}`,
    `.label{${label}}`,
    `.hud{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 20px;margin:0;padding:max(14px,env(safe-area-inset-top)) max(var(--gutter),env(safe-area-inset-right)) 14px max(var(--gutter),env(safe-area-inset-left));color:var(--color-contour)}`,
    `.hud p{margin:0}.hud .brand{color:var(--color-glacier);font-weight:700}`,
    `main{flex:1;display:flex;flex-direction:column;justify-content:center;width:100%;max-width:76rem;margin:0 auto;padding:clamp(28px,7vh,88px) max(var(--gutter),env(safe-area-inset-right)) clamp(28px,7vh,88px) max(var(--gutter),env(safe-area-inset-left))}`,
    `.name{margin:0 0 .28em;font:800 clamp(3.25rem,14.5vw,10.5rem)/var(--type-display-lh) "Archivo Display",system-ui,sans-serif;text-transform:uppercase;letter-spacing:-.01em;overflow-wrap:anywhere}`,
    `.role{margin:0;font-size:clamp(1.0625rem,2.2vw,1.375rem);line-height:1.4;text-wrap:balance}`,
    // The status line says how to get in, so it reads in sheet.
    `.status{margin:.4em 0 0;max-width:34rem;text-wrap:balance}`,
    `.contact{display:flex;flex-wrap:wrap;gap:8px 28px;margin:28px 0 0;padding:0;list-style:none}`,
    `.contact a,.contact .pending{display:inline-block;padding:10px 0;${label};color:var(--color-glacier);text-decoration:underline;text-underline-offset:.35em;text-decoration-thickness:1px}`,
    `.contact .pending{color:var(--color-contour);text-decoration:none}`,
    `.contact a:hover{color:var(--color-paper-dusk)}`,
    `.access{margin-top:clamp(36px,7vh,64px);max-width:30rem}`,
    `.access h2{margin:0 0 14px;color:var(--color-contour)}`,
    `.access label{display:block;margin-bottom:6px;font-size:.9375rem}`,
    `.field{display:flex;flex-wrap:wrap;gap:10px}`,
    // The password field; its underline (.line) draws on focus over --dur-trail (280 ms).
    // Static font instances here: nothing changes width.
    `.input{position:relative;display:flex;flex:1 1 12rem;min-width:0}`,
    `.field input{flex:1;min-width:0;min-height:48px;margin:0;padding:0 14px;border:1px solid var(--color-contour);border-radius:2px;background:rgb(27 28 24/.88);color:var(--color-paper-dusk);font:inherit}`,
    `.line{position:absolute;inset:auto 0 0;height:2px;background:var(--color-glacier);transform:scaleX(0);transform-origin:left center;transition:transform var(--dur-trail) var(--ease-settle);pointer-events:none}`,
    `.input:focus-within .line{transform:none}`,
    // An error is the signal colour and the message, never a shake.
    `.field input[aria-invalid=true]{border-color:var(--color-signal)}`,
    `.field input[aria-invalid=true]+.line{background:var(--color-signal)}`,
    `.field button{flex:0 0 auto;min-height:48px;margin:0;padding:0 18px;border:0;border-radius:2px;background:var(--color-glacier);color:var(--color-ground);${label};font-size:.8125rem;letter-spacing:.08em;cursor:pointer}`,
    `.field button:hover{background:var(--color-paper-dusk)}`,
    `.field button[aria-disabled=true]{cursor:progress}`,
    `:focus-visible{outline:2px solid var(--color-glacier);outline-offset:3px}`,
    `.field input:focus-visible{outline-offset:2px}`,
    `.error{margin:12px 0 0;color:var(--color-signal)}`,
    // Reduced motion: the underline appears at once.
    `@media (prefers-reduced-motion:reduce){.line{transition:none}}`,
    `.closed{margin:0;color:var(--color-contour)}`,
    `footer{padding:14px max(var(--gutter),env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(var(--gutter),env(safe-area-inset-left));color:var(--color-contour)}`,
    `footer a{color:inherit;text-underline-offset:.35em}footer a:hover{color:var(--color-paper-dusk)}`,
  ].join("");
}

// The submit button's "Checking…" while the password is checked. Without JavaScript the page is
// complete, just without it.
const script = `(()=>{
const submit=document.querySelector("[data-pending]");
const idle=submit&&submit.textContent;
if(submit)submit.form.addEventListener("submit",(e)=>{if(submit.getAttribute("aria-disabled")==="true"){e.preventDefault();return}submit.textContent=submit.dataset.pending;submit.setAttribute("aria-disabled","true")});
addEventListener("pageshow",(e)=>{if(e.persisted&&submit){submit.textContent=idle;submit.removeAttribute("aria-disabled")}});
})();`.replace(/\n/g, "");

/** The page model (see src/hosting/page.ts) for assets copied by `copyAssets`. */
export function pageModel(assets, { canonical }) {
  const name = holding.name;
  return {
    lang: site.lang,
    title: holding.meta.title(name),
    description: holding.meta.description(name),
    canonical,
    name,
    role: holding.role,
    status: holding.status,
    contact: holding.contact.map(({ label, href }) => ({ label, href })),
    placeholder: about.placeholderAction,
    brand: holding.brand,
    access: holding.access,
    credit: { label: site.footer.credit, href: site.footer.creditHref },
    css: css(assets),
    script,
    preload: [assets.fonts.display],
  };
}

/** Content-Security-Policy for the page: only its own inline style and script, fonts and posters. */
export function contentSecurityPolicy(model, formAction) {
  const hash = (text) => `'sha256-${sha256(text).toString("base64")}'`;
  return [
    "default-src 'none'",
    `style-src ${hash(model.css)}`,
    `script-src ${hash(model.script)}`,
    "font-src 'self'",
    "img-src 'self' data:",
    `form-action ${formAction}`,
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
}
