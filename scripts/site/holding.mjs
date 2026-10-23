// The night-summit page's assets and model, shared by the under-construction page
// (construction mode) and the Basecamp gate (basecamp mode): fonts, posters, CSS from the
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
  const label = `font:500 var(--type-hud-size)/1.4 "Martian Mono",ui-monospace,monospace;letter-spacing:var(--type-hud-tracking);text-transform:uppercase`;
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
    `body{margin:0;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;color:var(--color-sheet);font:400 var(--type-body-size)/var(--type-body-lh) "Archivo Text",system-ui,sans-serif}`,
    // Terrain: the poster dimmed, the headlamp (the same poster, brighter, masked to a circle
    // around the pointer) and a vignette that keeps the text legible.
    `.terrain{position:fixed;inset:0;z-index:-1;overflow:hidden}`,
    `.poster,.lamp{position:absolute;inset:0;background:var(--poster) center/cover no-repeat}`,
    `.poster{opacity:.42}`,
    `.lamp{--x:50vw;--y:50vh;opacity:0;filter:brightness(1.9);-webkit-mask:radial-gradient(circle min(36vmax,340px) at var(--x) var(--y),#000 0,rgb(0 0 0/.55) 45%,transparent 100%);mask:radial-gradient(circle min(36vmax,340px) at var(--x) var(--y),#000 0,rgb(0 0 0/.55) 45%,transparent 100%);transition:opacity var(--dur-long) var(--ease-trail)}`,
    `.lamp.on{opacity:1;transition-duration:var(--dur-short)}`,
    `.terrain::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgb(27 28 24/.9),transparent 18%,transparent 82%,rgb(27 28 24/.9)),radial-gradient(130% 85% at 0% 55%,rgb(27 28 24/.88) 0,rgb(27 28 24/.6) 45%,rgb(27 28 24/0) 80%)}`,
    `@media (prefers-reduced-motion:reduce){.lamp{display:none}}`,
    `.label{${label}}`,
    `.hud{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 20px;margin:0;padding:max(14px,env(safe-area-inset-top)) max(var(--gutter),env(safe-area-inset-right)) 14px max(var(--gutter),env(safe-area-inset-left));color:var(--color-contour)}`,
    `.hud p{margin:0}.hud .clock{margin-left:auto}.hud [hidden]{display:none}`,
    `main{flex:1;display:flex;flex-direction:column;justify-content:center;width:100%;max-width:76rem;margin:0 auto;padding:clamp(28px,7vh,88px) max(var(--gutter),env(safe-area-inset-right)) clamp(28px,7vh,88px) max(var(--gutter),env(safe-area-inset-left))}`,
    `.name{margin:0 0 .28em;font:800 clamp(3.25rem,14.5vw,10.5rem)/var(--type-display-lh) "Archivo Display",system-ui,sans-serif;text-transform:uppercase;letter-spacing:-.01em;overflow-wrap:anywhere}`,
    `.role{margin:0;font-size:clamp(1.0625rem,2.2vw,1.375rem);line-height:1.4;text-wrap:balance}`,
    `.status{margin:.4em 0 0;color:var(--color-contour);max-width:34rem;text-wrap:balance}`,
    `.contact{display:flex;flex-wrap:wrap;gap:8px 28px;margin:28px 0 0;padding:0;list-style:none}`,
    `.contact a,.contact .pending{display:inline-block;padding:10px 0;${label};color:var(--color-glacier);text-decoration:underline;text-underline-offset:.35em;text-decoration-thickness:1px}`,
    `.contact .pending{color:var(--color-contour);text-decoration:none}`,
    `.contact a:hover{color:var(--color-sheet)}`,
    `.access{margin-top:clamp(36px,7vh,64px);max-width:30rem}`,
    `.access h2{margin:0 0 14px;color:var(--color-contour)}`,
    `.access label{display:block;margin-bottom:6px;font-size:.9375rem}`,
    `.field{display:flex;flex-wrap:wrap;gap:10px}`,
    `.field input{flex:1 1 12rem;min-width:0;min-height:48px;margin:0;padding:0 14px;border:1px solid var(--color-contour);border-radius:2px;background:rgb(27 28 24/.88);color:var(--color-sheet);font:inherit}`,
    `.field input[aria-invalid=true]{border-color:var(--color-alpenglow)}`,
    `.field button{flex:0 0 auto;min-height:48px;margin:0;padding:0 18px;border:0;border-radius:2px;background:var(--color-glacier);color:var(--color-ground);${label};font-size:.8125rem;letter-spacing:.08em;cursor:pointer}`,
    `.field button:hover{background:var(--color-sheet)}`,
    `:focus-visible{outline:2px solid var(--color-glacier);outline-offset:3px}`,
    `.field input:focus-visible{outline-offset:2px}`,
    `.error{margin:12px 0 0;color:var(--color-alpenglow)}`,
    `.closed{margin:0;color:var(--color-contour)}`,
    `footer{padding:14px max(var(--gutter),env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(var(--gutter),env(safe-area-inset-left));color:var(--color-contour)}`,
    `footer a{color:inherit;text-underline-offset:.35em}footer a:hover{color:var(--color-sheet)}`,
  ].join("");
}

// Live Bern time (minute precision, like the site's HUD clock) and the headlamp glow. Both
// stay off with reduced motion; without JavaScript the page is complete, just without them.
const script = `(()=>{
const reduce=matchMedia("(prefers-reduced-motion: reduce)"),clock=document.querySelector("[data-clock]"),lamp=document.querySelector(".lamp");
const format=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Zurich",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
let timer=0;
const tick=()=>{const now=new Date();clock.textContent=format.format(now);clock.dateTime=now.toISOString();timer=setTimeout(tick,60000-now.getTime()%60000)};
const apply=()=>{clearTimeout(timer);clock.parentElement.hidden=reduce.matches;if(reduce.matches)lamp.classList.remove("on");else tick()};
const move=(e)=>{if(reduce.matches)return;lamp.style.setProperty("--x",e.clientX+"px");lamp.style.setProperty("--y",e.clientY+"px");lamp.classList.add("on")};
const off=()=>lamp.classList.remove("on");
addEventListener("pointermove",move,{passive:true});
addEventListener("pointerdown",move,{passive:true});
addEventListener("pointerup",(e)=>{if(e.pointerType!=="mouse")off()});
addEventListener("pointercancel",off);
addEventListener("pointerout",(e)=>{if(!e.relatedTarget)off()});
reduce.addEventListener("change",apply);
apply();
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
    hud: holding.hud,
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
