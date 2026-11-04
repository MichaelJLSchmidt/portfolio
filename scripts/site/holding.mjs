// The under-construction page's assets and model, shared by the under-construction page
// (construction mode) and the password gate (basecamp mode): fonts, the region's poster and field
// map, CSS from the design tokens, the inline script (the live contour field, src/field/core.ts
// transpiled and inlined, and the submit button's pending state) and the copy from
// src/content/about.ts.
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import "../lib/ts-hooks.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { about, holding } = await import("../../src/content/about.ts");
const { site } = await import("../../src/content/site.ts");
const { tokensToCss } = await import("../../src/styles/tokens.ts");
const { fieldMotion, fieldOptions, terrainSource } = await import("../../src/field/index.ts");
const field = JSON.parse(readFileSync(join(root, "public/terrain/field/field.json"), "utf8"));

const sha256 = (data) => createHash("sha256").update(data).digest();
const fontDir = join(root, "src/hosting/fonts");

/**
 * Copies the page's fonts, the region's posters and its field map into `dir` under
 * content-hashed names and returns their URLs under `prefix`.
 */
export function copyAssets(dir, prefix) {
  mkdirSync(dir, { recursive: true });
  const put = (source) => {
    const ext = extname(source);
    const name = `${basename(source, ext)}.${sha256(readFileSync(source)).toString("hex").slice(0, 10)}${ext}`;
    copyFileSync(source, join(dir, name));
    return `${prefix}${name}`;
  };
  const poster = field.posters.region;
  return {
    fonts: {
      display: put(join(fontDir, "archivo-display.woff2")),
      text: put(join(fontDir, "archivo-text.woff2")),
      mono: put(join(fontDir, "martian-mono.woff2")),
    },
    // The field's first frame of the region (npm run posters), framed on Interlaken like the site.
    poster: {
      landscape: put(join(root, "public", poster.landscape)),
      portrait: put(join(root, "public", poster.portrait)),
      position: `${(poster.focus.u * 100).toFixed(2)}% ${(poster.focus.v * 100).toFixed(2)}%`,
    },
    // The region's field map and its exact-decode fallback (≤ 150 KB, public/terrain/field).
    field: {
      image: put(join(root, "public", field.terrains.region.file)),
      raw: put(join(root, "public", field.terrains.region.raw)),
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
    `:root{--poster:url(${poster.landscape});--gutter:16px;color-scheme:dark}`,
    `@media (orientation:portrait){:root{--poster:url(${poster.portrait})}}`,
    `@media (min-width:48rem){:root{--gutter:40px}}`,
    `*,*::before,*::after{box-sizing:border-box}`,
    `html{-webkit-text-size-adjust:100%;text-size-adjust:100%;background:var(--color-ground)}`,
    `body{margin:0;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;color:var(--color-text);font:400 var(--type-body-size)/var(--type-body-lh) "Archivo Text",system-ui,sans-serif}`,
    `.visually-hidden{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}`,
    // The reference background: the field's poster (its first frame), then the live field on the
    // identical frame once it has drawn (the inline script); a light vignette at top and bottom.
    `.terrain{position:fixed;inset:0;z-index:-1;overflow:hidden}`,
    `.poster{position:absolute;inset:0;background:var(--poster) ${poster.position}/cover no-repeat}`,
    `.terrain canvas{position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity var(--dur-base) linear}`,
    `[data-field=on] .terrain canvas{opacity:1}`,
    `.terrain::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgb(27 28 24/.85),transparent 16%,transparent 84%,rgb(27 28 24/.85))}`,
    // Over the poster (no quiet zones there) text keeps a soft ground halo.
    `:root:not([data-field=on]) :is(main,footer){text-shadow:0 0 2px var(--color-ground),0 0 6px var(--color-ground),0 0 12px var(--color-ground)}`,
    `input,button{text-shadow:none}`,
    `.label{${label}}`,
    `main{flex:1;display:grid;align-content:center;justify-items:center;gap:20px;width:100%;max-width:60rem;margin:0 auto;padding:clamp(40px,10vh,120px) max(var(--gutter),env(safe-area-inset-right)) clamp(28px,6vh,72px) max(var(--gutter),env(safe-area-inset-left));text-align:center}`,
    // The mark: the brand in outline (the relief fill arrives in phase 7). Sized by the screen,
    // never by its length; it wraps if it must.
    `.mark{margin:0;font:800 clamp(4.5rem,20vw,13rem)/.9 "Archivo Display",system-ui,sans-serif;letter-spacing:-.035em;color:transparent;-webkit-text-stroke:1px var(--color-text);overflow-wrap:anywhere}`,
    `.role{margin:0;color:var(--color-text-2)}`,
    `.status{margin:0;max-width:34rem;text-wrap:balance}`,
    `.contact{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 24px;margin:0;padding:0;list-style:none}`,
    `.contact a,.contact .pending{display:inline-flex;align-items:center;min-height:44px;${label};color:var(--color-text);text-decoration:underline;text-decoration-color:color-mix(in srgb,currentColor 55%,transparent);text-underline-offset:.35em;text-decoration-thickness:1px}`,
    `.contact .pending{color:var(--color-text-2);text-decoration:none}`,
    `.contact a:hover{text-decoration-color:currentColor}`,
    `.access{width:100%;max-width:28rem;margin-top:12px;text-align:left}`,
    `.access label{display:block;margin-bottom:6px;color:var(--color-text-2)}`,
    `.field{display:flex;flex-wrap:wrap;gap:10px}`,
    // The password field and the survey button: 1 px text-3 frames, square corners.
    `.field input{flex:1 1 12rem;min-width:0;min-height:48px;margin:0;padding:0 14px;border:1px solid var(--color-text-3);border-radius:0;background:rgb(27 28 24/.9);color:var(--color-text);font:inherit}`,
    `.field input:hover{border-color:var(--color-text-2)}`,
    `.field input[aria-invalid=true]{border-color:var(--color-text)}`,
    `.field button{display:inline-flex;align-items:center;gap:10px;flex:0 0 auto;min-height:48px;margin:0;padding:0 18px;border:1px solid var(--color-text-3);border-radius:0;background:rgb(27 28 24/.9);color:var(--color-text);${label};cursor:pointer;transition:border-color var(--dur-fast) linear,transform var(--dur-press) var(--ease-out)}`,
    `.field button [data-arrow]{display:inline-block;transition:transform var(--dur-fast) var(--ease-out)}`,
    `.field button:hover{border-color:var(--color-text)}`,
    `.field button:hover [data-arrow]{transform:translate(3px,-3px)}`,
    `.field button:active{transform:scale(.985)}`,
    `.field button[aria-disabled=true]{cursor:progress}`,
    `:focus-visible{outline:2px solid var(--color-glacier);outline-offset:3px}`,
    `.field input:focus-visible{outline-offset:2px}`,
    // An error: the message in the text colour with an icon, never red, never a shake.
    `.error{display:flex;gap:10px;align-items:flex-start;margin:12px 0 0;color:var(--color-text)}`,
    `.error svg{flex:none;width:18px;height:18px;margin-top:.15em;fill:none;stroke:currentColor;stroke-width:1.5}`,
    `.closed{margin:0;color:var(--color-text-2);text-align:center}`,
    `@media (prefers-reduced-motion:reduce){*{transition:none!important}}`,
    `footer{padding:14px max(var(--gutter),env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(var(--gutter),env(safe-area-inset-left));color:var(--color-text-2);text-align:center}`,
    `footer a{color:inherit;text-underline-offset:.35em}footer a:hover{color:var(--color-text)}`,
  ].join("");
}

/**
 * The live contour field, as on the site: src/field/core.ts with its types stripped
 * (typescript.transpileModule) and inlined, so the page needs nothing but its own hash in the CSP.
 * It runs the region with the site's tuning, drift, breath and (fine pointers) the bump; never
 * under reduced motion, Save-Data or little memory, where the poster stays.
 */
function fieldScript(assets) {
  const core = ts
    .transpileModule(readFileSync(join(root, "src/field/core.ts"), "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: true },
    })
    .outputText.replace(/^export\s+(?=(?:async\s+)?function|const|let|class)/gm, "")
    .replace(/^export\s*\{\s*\};?\s*$/gm, "");
  const source = { ...terrainSource("region"), image: assets.field.image, raw: assets.field.raw };
  const options = { desktop: fieldOptions("desktop"), mobile: fieldOptions("mobile") };
  const motion = { fine: fieldMotion("full", true), touch: fieldMotion("full", false) };
  return `(()=>{${core}
const d=document.documentElement,n=navigator;
try{if(matchMedia("(prefers-reduced-motion: reduce)").matches||n.connection&&n.connection.saveData||n.deviceMemory&&n.deviceMemory<4)return}catch(e){return}
const canvas=document.querySelector("canvas[data-field-canvas]");
if(!canvas)return;
const fine=matchMedia("(hover: hover) and (pointer: fine)").matches;
const tier=fine&&Math.max(screen.width,screen.height)>=900?"desktop":"mobile";
let field=null;
field=createField(canvas,${JSON.stringify(options)}[tier],{onFirstFrame(){d.setAttribute("data-field","on")},onLost(){d.setAttribute("data-field","lost");if(field)field.destroy()}});
if(!field)return;
field.setMotion(${JSON.stringify(motion)}[fine?"fine":"touch"]);
const zones=()=>field.setQuietZones([...document.querySelectorAll("[data-quiet-zone]")].map((e)=>{const r=e.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom}}));
zones();
addEventListener("resize",()=>{field.resize();zones()});
document.addEventListener("visibilitychange",()=>field.setPaused(document.hidden));
if(fine){addEventListener("pointermove",(e)=>{if(e.pointerType==="mouse")field.pointer(e.clientX,e.clientY)},{passive:true});d.addEventListener("pointerleave",()=>field.pointer(null,null))}
field.show(${JSON.stringify(source)}).then(zones,()=>d.setAttribute("data-field","lost"));
})();`;
}

// The submit button's "Checking…" while the password is checked. Without JavaScript the page is
// complete, just without it.
const submitScript = `(()=>{
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
    script: `${fieldScript(assets)}\n${submitScript}`,
    preload: [assets.fonts.display],
  };
}

/** Content-Security-Policy for the page: only its own inline style and script, fonts, posters and the field map. */
export function contentSecurityPolicy(model, formAction) {
  const hash = (text) => `'sha256-${sha256(text).toString("base64")}'`;
  return [
    "default-src 'none'",
    `style-src ${hash(model.css)}`,
    `script-src ${hash(model.script)}`,
    "font-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    `form-action ${formAction}`,
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
}
