import { caseStudyLabels as L } from "@/content/case-study-labels";
import { haptic } from "@/lib/haptics";
import { currentMode } from "@/lib/motion-mode";
import { isSettled, markSettled, settleKey } from "@/lib/settled";
import { duration } from "@/styles/tokens";

/**
 * Before/after comparison (Figure.tsx renders the markup): a native range input, labelled
 * "Compare before and after", moves the clip of the "before" image (arrow keys, Page Up/Down,
 * Home/End and dragging come with the input); "Before", "After" and "Side by side" buttons set
 * the view. Without JavaScript both images stack, each with its own alt text.
 *
 * Motion: the labels stay put (text never moves);
 * the first time the slider is in view this session (full motion) the divider nudges 50 → 56 → 50%
 * once, a hint that it moves; landing on 0, 50 or 100% ticks the detent haptic.
 */
export function attach(figure: HTMLElement): () => void {
  const root = figure.querySelector<HTMLElement>("[data-compare]");
  const range = root?.querySelector<HTMLInputElement>("[data-compare-range]");
  if (!root || !range) return () => {};
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-compare-view]")];

  const sync = () => {
    const pos = Number(range.value);
    root.style.setProperty("--pos", `${pos}%`);
    range.setAttribute("aria-valuetext", L.compareValue(pos));
    const view = root.dataset.view;
    for (const b of buttons) {
      const v = b.dataset.compareView;
      const pressed = v === "side" ? view === "side" : view !== "side" && pos === (v === "before" ? 100 : 0);
      b.setAttribute("aria-pressed", String(pressed));
    }
  };
  // Detents at 0, 50 and 100%.
  let detent: number | null = Number(range.value);
  const onInput = () => {
    root.dataset.view = "slider";
    stopHint();
    const pos = Number(range.value);
    if ((pos === 0 || pos === 50 || pos === 100) && pos !== detent) haptic("detent");
    detent = pos === 0 || pos === 50 || pos === 100 ? pos : null;
    sync();
  };

  // The hint: once per session, in full motion, when the slider is well in view.
  const key = settleKey(window.location.pathname, `compare-hint:${range.getAttribute("aria-describedby") ?? ""}`);
  let raf = 0;
  const stopHint = () => {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
    root.style.setProperty("--pos", `${range.value}%`);
  };
  const hint = () => {
    const start = performance.now();
    const total = duration.long;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / total);
      // Out to 56% and back to 50% in one smooth swing.
      root.style.setProperty("--pos", `${50 + 6 * Math.sin(Math.PI * t)}%`);
      raf = t < 1 ? requestAnimationFrame(step) : 0;
    };
    raf = requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      if (isSettled(key) || currentMode() !== "full" || range.value !== "50" || root.dataset.view !== "slider") return;
      markSettled(key);
      hint();
    },
    { threshold: 0.6 },
  );
  io.observe(root);
  const stopOnTouch = () => stopHint();
  root.addEventListener("pointerdown", stopOnTouch);
  range.addEventListener("keydown", stopOnTouch);
  const onClick = (e: Event) => {
    haptic("press");
    const v = (e.currentTarget as HTMLButtonElement).dataset.compareView;
    if (v === "side") {
      root.dataset.view = root.dataset.view === "side" ? "slider" : "side";
    } else {
      root.dataset.view = "slider";
      range.value = v === "before" ? "100" : "0";
    }
    sync();
  };

  root.dataset.enhanced = "true";
  range.addEventListener("input", onInput);
  buttons.forEach((b) => b.addEventListener("click", onClick));
  sync();
  return () => {
    io.disconnect();
    stopHint();
    root.removeEventListener("pointerdown", stopOnTouch);
    range.removeEventListener("keydown", stopOnTouch);
    range.removeEventListener("input", onInput);
    buttons.forEach((b) => b.removeEventListener("click", onClick));
  };
}
