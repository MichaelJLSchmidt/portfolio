/**
 * Motion's frame loop on its own: the page's single animation loop (Lenis, the contour field,
 * kinetic type proximity and Motion's springs all run on it). Import this module lazily —
 * `import("@/lib/frameloop")` — rather than `import("motion")`, so the chunk holds only the
 * loop and not the whole of Motion.
 */
export { cancelFrame, frame } from "motion";
export type { Process } from "motion";
