import { caseStudyLabels as L } from "@/content/case-study-labels";
import { haptic } from "@/lib/haptics";
import { activeViewTransition, stillNavigation } from "@/lib/view-transition";

/**
 * Lightbox for a wide figure, on a native <dialog> (Figure.tsx renders the markup):
 * - "Enlarge" replaces the full-size link; showModal() moves focus in, Esc closes, and focus
 *   returns to the button;
 * - the largest source loads on open;
 * - zoom 100–400% with +/−/reset (their names include the level), click to step in (at the
 *   maximum, click resets), the wheel around the pointer, pinch on touch; drag or one finger
 *   pans when zoomed;
 * - opening, the figure's image morphs into the overlay's on the share spring (a view transition,
 *   html[data-vt="lightbox"]), and back on close; still mode opens and closes at once;
 * - its buttons (Enlarge, zoom, Close) tick the press haptic;
 * - no zoom animation with reduced motion (Figure.module.css).
 */
const MORPH = "lightbox-figure";

/** Runs `update` in a view transition in which `from` (before) and `to` (after) are one element. */
function morph(from: HTMLElement | null, to: HTMLElement | null, update: () => void) {
  if (!from || !to || stillNavigation() || typeof document.startViewTransition !== "function") return update();
  const root = document.documentElement;
  const name = (el: HTMLElement | null, on: boolean) => {
    el?.style.setProperty("view-transition-name", on ? MORPH : "");
    el?.style.setProperty("view-transition-class", on ? "morph morph-art" : "");
  };
  root.setAttribute("data-vt", "lightbox");
  name(from, true);
  try {
    const t = document.startViewTransition(() => {
      name(from, false);
      name(to, true);
      update();
    });
    const done = () => {
      name(to, false);
      if (root.getAttribute("data-vt") === "lightbox") root.removeAttribute("data-vt");
    };
    t.finished.then(done, done);
  } catch {
    name(from, false);
    root.removeAttribute("data-vt");
    update();
  }
}
const MIN = 1;
const MAX = 4;
const STEPS = [1, 1.5, 2, 3, 4];

export function attach(figure: HTMLElement): () => void {
  const open = figure.querySelector<HTMLButtonElement>("[data-lightbox-open]");
  const fallback = figure.querySelector<HTMLAnchorElement>("[data-lightbox-fallback]");
  const dialog = figure.querySelector<HTMLDialogElement>("dialog[data-lightbox]");
  const stage = dialog?.querySelector<HTMLElement>("[data-lightbox-stage]");
  const img = dialog?.querySelector<HTMLImageElement>("img[data-src]");
  if (!open || !dialog || !stage || !img) return () => {};
  const source = dialog.querySelector<HTMLSourceElement>("source[data-srcset]");
  const level = dialog.querySelector<HTMLElement>("[data-zoom-level]");
  const status = dialog.querySelector<HTMLElement>("[data-zoom-status]");
  const zoomIn = dialog.querySelector<HTMLButtonElement>('[data-zoom="in"]');
  const zoomOut = dialog.querySelector<HTMLButtonElement>('[data-zoom="out"]');
  const zoomReset = dialog.querySelector<HTMLButtonElement>('[data-zoom="reset"]');
  const close = dialog.querySelector<HTMLButtonElement>("[data-lightbox-close]");

  open.hidden = false;
  if (fallback) fallback.hidden = true;

  let scale = 1;
  let x = 0;
  let y = 0;

  // Keep the image covering the stage: no panning past its edges.
  const clamp = () => {
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const w = img.clientWidth * scale;
    const h = img.clientHeight * scale;
    const mx = Math.max(0, (w - sw) / 2);
    const my = Math.max(0, (h - sh) / 2);
    x = Math.min(mx, Math.max(-mx, x));
    y = Math.min(my, Math.max(-my, y));
  };

  const render = (announce = true) => {
    clamp();
    img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    stage.dataset.zoomed = scale > 1 ? "true" : "false";
    const pct = Math.round(scale * 100);
    if (level) level.textContent = `${pct}%`;
    zoomIn?.setAttribute("aria-label", L.zoomIn(pct));
    zoomOut?.setAttribute("aria-label", L.zoomOut(pct));
    zoomReset?.setAttribute("aria-label", L.zoomReset(pct));
    if (zoomIn) zoomIn.disabled = scale >= MAX;
    if (zoomOut) zoomOut.disabled = scale <= MIN;
    if (announce && status) status.textContent = L.zoomStatus(pct);
  };

  /** Zooms to `next`, keeping the stage point (px, py) — relative to its centre — in place. */
  const zoomTo = (next: number, px = 0, py = 0) => {
    const s = Math.min(MAX, Math.max(MIN, next));
    const k = s / scale;
    x = px - (px - x) * k;
    y = py - (py - y) * k;
    scale = s;
    if (scale === 1) x = y = 0;
    render();
  };
  const step = (dir: 1 | -1) => {
    const next = dir > 0 ? STEPS.find((s) => s > scale + 0.01) : [...STEPS].reverse().find((s) => s < scale - 0.01);
    zoomTo(next ?? (dir > 0 ? MAX : MIN));
  };
  const local = (e: { clientX: number; clientY: number }) => {
    const r = stage.getBoundingClientRect();
    return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2] as const;
  };

  // The figure's own image, on the page: one end of the morph.
  const shown = figure.querySelector<HTMLImageElement>("[data-reveal] img, picture img");
  const onOpen = () => {
    const first = !img.getAttribute("src");
    // The image already on screen first (so the morph lands on a picture), the largest after.
    if (first) img.src = shown?.currentSrc || img.dataset.src!;
    scale = 1;
    x = y = 0;
    render(false);
    morph(shown, img, () => {
      dialog.showModal();
      close?.focus();
    });
    if (first)
      requestAnimationFrame(() => {
        if (source?.dataset.srcset) source.srcset = source.dataset.srcset;
        img.src = img.dataset.src!;
      });
  };
  const onClose = () => open.focus();
  // Closing (button, backdrop, Esc) morphs the image back into the figure.
  const shut = () => morph(img, shown, () => dialog.close());
  const onClick = (e: MouseEvent) => {
    // A click on the backdrop (the dialog itself, outside its content) closes it. Not while the
    // morph runs: the browser hit-tests past the travelling image then, onto the backdrop.
    if (e.target === dialog && !activeViewTransition()) shut();
  };

  // Pointers: drag to pan, two fingers to pinch, a click without movement to zoom in.
  const pointers = new Map<number, { x: number; y: number }>();
  let moved = false;
  let pinch: { dist: number; scale: number } | null = null;
  const distance = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  // Drag and pinch only: the stage listens for movement while a pointer is held down, never at rest.
  const onDown = (e: PointerEvent) => {
    stage.setPointerCapture(e.pointerId);
    if (!pointers.size) stage.addEventListener("pointermove", onMove);
    // Follow the fingers directly: no easing while a gesture is under way.
    stage.dataset.gesture = "";
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    if (pointers.size === 2) pinch = { dist: distance(), scale };
  };
  const onMove = (e: PointerEvent) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const [cx, cy] = local({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
      zoomTo(pinch.scale * (distance() / pinch.dist), cx, cy);
    } else if (scale > 1) {
      x += dx;
      y += dy;
      render(false);
    }
  };
  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!pointers.size) {
      delete stage.dataset.gesture;
      stage.removeEventListener("pointermove", onMove);
    }
    if (!moved && e.pointerType === "mouse" && e.button === 0) {
      const [px, py] = local(e);
      if (scale >= MAX) zoomTo(1);
      else zoomTo(STEPS.find((s) => s > scale + 0.01) ?? MAX, px, py);
    }
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const [px, py] = local(e);
    zoomTo(scale * Math.exp(-e.deltaY * 0.0025), px, py);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "+" || e.key === "=") step(1);
    else if (e.key === "-") step(-1);
    else if (e.key === "0") zoomTo(1);
  };
  const onIn = () => step(1);
  const onOut = () => step(-1);
  const onReset = () => zoomTo(1);
  const onCloseButton = () => shut();
  const onCancel = (e: Event) => {
    e.preventDefault();
    shut();
  };
  const onResize = () => render(false);

  // Buttons tick the press haptic (Android; haptics.ts decides).
  const press = () => haptic("press");
  const buttons = [open, zoomIn, zoomOut, zoomReset, close].filter((b): b is HTMLButtonElement => !!b);
  buttons.forEach((b) => b.addEventListener("click", press));
  open.addEventListener("click", onOpen);
  dialog.addEventListener("close", onClose);
  dialog.addEventListener("cancel", onCancel);
  dialog.addEventListener("click", onClick);
  dialog.addEventListener("keydown", onKey);
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);
  stage.addEventListener("wheel", onWheel, { passive: false });
  zoomIn?.addEventListener("click", onIn);
  zoomOut?.addEventListener("click", onOut);
  zoomReset?.addEventListener("click", onReset);
  close?.addEventListener("click", onCloseButton);
  window.addEventListener("resize", onResize);

  return () => {
    buttons.forEach((b) => b.removeEventListener("click", press));
    open.removeEventListener("click", onOpen);
    dialog.removeEventListener("close", onClose);
    dialog.removeEventListener("cancel", onCancel);
    dialog.removeEventListener("click", onClick);
    dialog.removeEventListener("keydown", onKey);
    stage.removeEventListener("pointerdown", onDown);
    stage.removeEventListener("pointermove", onMove);
    stage.removeEventListener("pointerup", onUp);
    stage.removeEventListener("pointercancel", onUp);
    stage.removeEventListener("wheel", onWheel);
    zoomIn?.removeEventListener("click", onIn);
    zoomOut?.removeEventListener("click", onOut);
    zoomReset?.removeEventListener("click", onReset);
    close?.removeEventListener("click", onCloseButton);
    window.removeEventListener("resize", onResize);
    if (dialog.open) dialog.close();
  };
}
