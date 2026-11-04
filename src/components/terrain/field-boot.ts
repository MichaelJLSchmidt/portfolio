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

/** WebGL2 with a hardware GPU (any GPU with `force`). The probe context is released at once. */
function webgl2(force: boolean): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: !force });
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return force || !/swiftshader|llvmpipe|software/i.test(renderer);
  } catch {
    return false;
  }
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

export function resolveTier(): FieldTier {
  const params = new URLSearchParams(window.location.search);
  const force = params.get("field") === "force";
  if (previewable) {
    const named = (params.get("tier") ?? "").toLowerCase();
    if (named === "desktop" || named === "mobile" || named === "low") return named === "low" || webgl2(true) ? named : "low";
  }
  try {
    if (sessionStorage.getItem(TIER_C_KEY) === "low") return "low";
  } catch {
    // No storage: decide from the device alone.
  }
  let tier = currentTier();
  if (force && tier === "low") tier = finePointerDesktop() ? "desktop" : "mobile";
  if (tier === "low") return "low";
  return webgl2(force) ? tier : "low";
}
