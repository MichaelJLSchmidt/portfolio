import { currentTier } from "@/lib/motion-mode";
import { deviceProfile, isMobileProfile, type DeviceProfile, type FieldTier } from "./field-settings";

/**
 * Decides, once the page is idle, whether this visit gets the WebGL field and in which tier.
 * Loaded lazily by the backdrop, so none of it is in a route's initial JavaScript.
 *
 * The tier is html[data-tier] (phase 1's pre-paint script: "desktop", "mobile", or "low" for
 * Save-Data, little memory or few cores), lowered to "low" (tier C, posters only) when WebGL2
 * is missing or software-rendered, or when the context was lost twice this session.
 * `?field=force` skips the low-spec checks (headless browsers); preview builds also accept
 * `?tier=desktop|mobile|low` (or A, B, C) for one page load.
 */
export const TIER_C_KEY = "summit:field-tier";

const previewable = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_PREVIEW === "1";
const NAMED: Record<string, FieldTier> = { a: "desktop", b: "mobile", c: "low", desktop: "desktop", mobile: "mobile", low: "low" };

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

/** After a second context loss: posters only for the rest of the session. */
export function markTierC() {
  try {
    sessionStorage.setItem(TIER_C_KEY, "low");
  } catch {
    // The field is unmounted for this page view anyway.
  }
}

export function resolveTier(): FieldTier {
  const params = new URLSearchParams(window.location.search);
  const force = params.get("field") === "force";
  if (previewable) {
    const named = NAMED[(params.get("tier") ?? "").toLowerCase()];
    if (named) return named === "low" || webgl2(true) ? named : "low";
  }
  try {
    if (sessionStorage.getItem(TIER_C_KEY) === "low") return "low";
  } catch {
    // No storage: decide from the device alone.
  }
  let tier = currentTier();
  if (force && tier === "low") tier = isMobileProfile() ? "mobile" : "desktop";
  if (tier === "low") return "low";
  return webgl2(force) ? tier : "low";
}

export function profileFor(tier: Exclude<FieldTier, "low">): DeviceProfile {
  return deviceProfile(tier);
}
