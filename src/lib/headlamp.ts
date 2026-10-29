import { headlamp } from "@/styles/tokens";

/**
 * The headlamp: one pointer source for everything the pointer lights (the contour field's
 * headlamp and parallax, the display-type shine). One pointermove listener for mouse and pen
 * (touch never lights type; the field follows touches itself), sampled once per frame on
 * Motion's frame loop (`frame.read`, loaded lazily), and one falloff and timing for all
 * (`headlamp` in the tokens). Subscribers decide whether their mode allows them to light up.
 */
export type Lamp = {
  /** Viewport CSS px. */
  x: number;
  y: number;
  /** False once the pointer has left the window. */
  on: boolean;
};
export type LampListener = (lamp: Lamp) => void;

const listeners = new Set<LampListener>();
let lamp: Lamp = { x: -1e4, y: -1e4, on: false };
let loop: typeof import("./frameloop") | null = null;
let queued = false;
let attached = false;

const flush = () => {
  queued = false;
  listeners.forEach((l) => l(lamp));
};
const schedule = () => {
  if (queued || !loop) return;
  queued = true;
  loop.frame.read(flush);
};
const onMove = (e: PointerEvent) => {
  if (e.pointerType === "touch") return;
  lamp = { x: e.clientX, y: e.clientY, on: true };
  schedule();
};
const onOut = (e: PointerEvent) => {
  if (e.relatedTarget || e.pointerType === "touch") return;
  lamp = { ...lamp, on: false };
  schedule();
};

function attach() {
  if (attached) return;
  attached = true;
  import("./frameloop").then((m) => {
    loop = m;
    if (!attached) return;
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
  });
}

function detach() {
  attached = false;
  window.removeEventListener("pointermove", onMove);
  document.removeEventListener("pointerout", onOut);
}

/** Follows the headlamp; the listener runs at most once per frame. Returns the unsubscribe. */
export function watchHeadlamp(listener: LampListener): () => void {
  listeners.add(listener);
  attach();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) detach();
  };
}

/** The headlamp's falloff for a distance in radii: 1 at the centre, 0 from one radius on. */
export function headlampFalloff(d: number, k: number = headlamp.falloff): number {
  const edge = Math.exp(-k);
  return Math.max(Math.exp(-k * d * d) - edge, 0) / (1 - edge);
}
