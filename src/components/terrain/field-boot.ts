import { currentTier } from "@/lib/motion-mode";

/**
 * Decides, once the page is idle, whether this visit gets the WebGL field and in which tier.
 *
 * The tier is html[data-tier] (the pre-paint script: "desktop", "mobile", or "low" for Save-Data,
 * little memory or few cores), lowered to "low" (posters only) when WebGL2 is missing or
 * software-rendered, or when the context was lost twice this session. `?field=force` skips the
 * low-spec checks (headless browsers); preview builds also accept `?tier=desktop|mobile|low`.
 */
export type FieldTier = "desktop" | "mobile" | "low";
export const TIER_C_KEY = "summit:field-tier";

const previewable = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_PREVIEW === "1";

const software = (renderer: string) => /swiftshader|llvmpipe|software/i.test(renderer);

/** WebGL2 with a hardware GPU (any GPU with `force`), asked on the page. The context is released at once. */
function webgl2OnPage(force: boolean): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: !force });
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return force || !software(renderer);
  } catch {
    return false;
  }
}

// The same probe in a worker: creating a context can take a long time (a GPU process starting, a
// software renderer), and there it never blocks the page. It answers "ok:<renderer>", "caveat"
// (WebGL2 only with a major performance caveat) or "none" (no WebGL2 in a worker).
const PROBE = `onmessage=()=>{let a="none";try{const c=new OffscreenCanvas(1,1);let gl=c.getContext("webgl2",{failIfMajorPerformanceCaveat:true});if(gl){const i=gl.getExtension("WEBGL_debug_renderer_info");a="ok:"+(i?String(gl.getParameter(i.UNMASKED_RENDERER_WEBGL)):"");gl.getExtension("WEBGL_lose_context")?.loseContext()}else if(new OffscreenCanvas(1,1).getContext("webgl2"))a="caveat"}catch{}postMessage(a)}`;

function probeOffPage(): Promise<string | null> {
  return new Promise((done) => {
    if (typeof Worker !== "function" || typeof OffscreenCanvas !== "function") return done(null);
    let url = "";
    let worker: Worker;
    try {
      url = URL.createObjectURL(new Blob([PROBE], { type: "text/javascript" }));
      worker = new Worker(url);
    } catch {
      if (url) URL.revokeObjectURL(url);
      return done(null);
    }
    const end = (answer: string | null) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      done(answer);
    };
    const timer = setTimeout(() => end(null), 4000);
    worker.onmessage = (e: MessageEvent) => end(typeof e.data === "string" ? e.data : null);
    worker.onerror = () => end(null);
    worker.postMessage(0);
  });
}

/** WebGL2 with a hardware GPU (any GPU with `force`): off the page where workers have WebGL2, else on it. */
async function webgl2(force: boolean): Promise<boolean> {
  const answer = await probeOffPage();
  if (answer?.startsWith("ok:")) return force || !software(answer.slice(3));
  if (answer === "caveat") return force;
  return webgl2OnPage(force);
}

/** After a lost context: posters only for the rest of the session. */
export function markTierC() {
  try {
    sessionStorage.setItem(TIER_C_KEY, "low");
  } catch {
    // The field is gone for this page view anyway.
  }
}

const finePointerDesktop = () => !window.matchMedia("(pointer: coarse)").matches && Math.max(window.innerWidth, window.innerHeight) >= 900;

export async function resolveTier(): Promise<FieldTier> {
  const params = new URLSearchParams(window.location.search);
  const force = params.get("field") === "force";
  if (previewable) {
    const named = (params.get("tier") ?? "").toLowerCase();
    if (named === "desktop" || named === "mobile" || named === "low") return named === "low" || (await webgl2(true)) ? named : "low";
  }
  try {
    if (sessionStorage.getItem(TIER_C_KEY) === "low") return "low";
  } catch {
    // No storage: decide from the device alone.
  }
  let tier = currentTier();
  if (force && tier === "low") tier = finePointerDesktop() ? "desktop" : "mobile";
  if (tier === "low") return "low";
  return (await webgl2(force)) ? tier : "low";
}
