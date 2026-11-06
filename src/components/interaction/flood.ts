import { duration } from "@/styles/tokens";

/**
 * The contour flood's runtime: one set of delegated listeners for every element marked
 * `data-flood` (a title, a button, the footer wordmark). It never follows the pointer: entering
 * (pointerover) reads where the pointer came in once, keyboard focus floods from the left, a tap
 * floods from the finger and recedes after --dur-flood-touch. It only writes the host's state and
 * entry point; the stylesheet (globals.css, "contour flood") steps the sprite's twelve frames in
 * full motion, cross-fades in calm and switches at once in still.
 *
 *   data-flood-state  "in" while hovered, focused or tapped; "out" as it recedes
 *   data-flood-src    "radial" (from --fx/--fy) or "sweep" (left to right)
 *   --fx --fy --ew --eh  the entry point and the host's size, in px
 */
let started = false;

type Host = HTMLElement & { _flood?: { hover: boolean; focus: boolean; touch: number } };

const hostOf = (target: EventTarget | null): Host | null =>
  target instanceof Element ? (target.closest<HTMLElement>("[data-flood]") as Host | null) : null;

function state(host: Host) {
  return (host._flood ??= { hover: false, focus: false, touch: 0 });
}

function place(host: Host, src: "radial" | "sweep", x?: number, y?: number) {
  const r = host.getBoundingClientRect();
  host.style.setProperty("--ew", `${r.width.toFixed(1)}px`);
  host.style.setProperty("--eh", `${r.height.toFixed(1)}px`);
  host.style.setProperty("--fx", `${((x ?? r.left) - r.left).toFixed(1)}px`);
  host.style.setProperty("--fy", `${((y ?? r.top + r.height / 2) - r.top).toFixed(1)}px`);
  host.setAttribute("data-flood-src", src);
}

function update(host: Host) {
  const s = state(host);
  const on = s.hover || s.focus || s.touch > 0;
  const current = host.getAttribute("data-flood-state");
  if (on && current !== "in") host.setAttribute("data-flood-state", "in");
  if (!on && current === "in") host.setAttribute("data-flood-state", "out");
}

export function startFlood() {
  if (started || typeof document === "undefined") return;
  started = true;

  // A mouse or pen entering: the flood grows from where it came in. Touch is handled on pointerdown.
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch") return;
    const host = hostOf(e.target);
    if (!host || host.contains(e.relatedTarget as Node | null)) return;
    const s = state(host);
    if (!s.focus && host.getAttribute("data-flood-state") !== "in") place(host, "radial", e.clientX, e.clientY);
    s.hover = true;
    update(host);
  });
  document.addEventListener("pointerout", (e) => {
    if (e.pointerType === "touch") return;
    const host = hostOf(e.target);
    if (!host || host.contains(e.relatedTarget as Node | null)) return;
    state(host).hover = false;
    update(host);
  });

  // A tap: from the finger, receding after --dur-flood-touch.
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType !== "touch") return;
      const host = hostOf(e.target);
      if (!host) return;
      const s = state(host);
      place(host, "radial", e.clientX, e.clientY);
      window.clearTimeout(s.touch);
      s.touch = window.setTimeout(() => {
        s.touch = 0;
        update(host);
      }, duration.floodTouch);
      update(host);
    },
    { passive: true },
  );

  // Keyboard focus: left to right. Focus from a click (no focus ring) leaves it to the pointer.
  document.addEventListener("focusin", (e) => {
    const host = hostOf(e.target);
    if (!host || !(e.target as Element).matches(":focus-visible")) return;
    const s = state(host);
    if (!s.hover) place(host, "sweep");
    s.focus = true;
    update(host);
  });
  document.addEventListener("focusout", (e) => {
    const host = hostOf(e.target);
    if (!host || host.contains(e.relatedTarget as Node | null)) return;
    state(host).focus = false;
    update(host);
  });
}
